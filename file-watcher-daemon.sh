#!/bin/bash

# File Watcher Daemon - LocalAgent Event Loop
# 
# This daemon monitors the file system for changes and triggers the LocalAgent
# for intelligent, autonomous responses. It uses platform-appropriate file 
# monitoring tools and maintains a lightweight event loop.
#
# Based on QwenCoder's filesystem event loop architecture

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(pwd)"
AGENT_CORE="$SCRIPT_DIR/local-agent-core.js"
PID_FILE="$SCRIPT_DIR/.localagent/file-watcher.pid"
LOG_FILE="$SCRIPT_DIR/.localagent/logs/file-watcher.log"
CONFIG_FILE="$SCRIPT_DIR/.localagent/watcher-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

debug() {
    if [ "$DEBUG" = "1" ]; then
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo -e "${BLUE}[$timestamp] DEBUG:${NC} $1" | tee -a "$LOG_FILE"
    fi
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        error "Unsupported operating system: $OSTYPE"
    fi
    debug "Detected OS: $OS"
}

# Create default configuration
create_default_config() {
    cat > "$CONFIG_FILE" << 'EOF'
{
  "watchPaths": [
    "src/",
    "lib/",
    "test/",
    "tests/",
    "docs/",
    "*.js",
    "*.ts",
    "*.jsx",
    "*.tsx",
    "*.py",
    "*.go",
    "*.rs",
    "*.java",
    "*.cpp",
    "*.c",
    "*.php",
    "*.rb",
    "*.swift",
    "*.kt",
    "*.json",
    "*.yaml",
    "*.yml",
    "*.toml",
    "*.md",
    "package.json",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "Makefile",
    "Dockerfile",
    "README*"
  ],
  "ignorePaths": [
    ".git/",
    "node_modules/",
    ".localagent/logs/",
    ".localagent/cache/",
    "dist/",
    "build/",
    "target/",
    "*.log",
    "*.tmp",
    ".DS_Store",
    "*.pyc",
    "__pycache__/",
    ".pytest_cache/",
    "coverage/",
    ".nyc_output/"
  ],
  "debounceMs": 1000,
  "maxEventsPerSecond": 10,
  "enableRecursive": true,
  "enableSymlinks": false,
  "eventTypes": {
    "create": true,
    "modify": true,
    "delete": true,
    "move": true
  },
  "agentConfig": {
    "autonomyLevel": "medium",
    "responseDelay": 2000,
    "batchEvents": true,
    "batchTimeoutMs": 5000
  }
}
EOF
    log "Created default configuration at $CONFIG_FILE"
}

# Load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        create_default_config
    fi
    
    # Extract key configuration values using basic shell parsing
    DEBOUNCE_MS=$(grep '"debounceMs"' "$CONFIG_FILE" | grep -o '[0-9]*' | head -1 || echo "1000")
    MAX_EVENTS_PER_SEC=$(grep '"maxEventsPerSecond"' "$CONFIG_FILE" | grep -o '[0-9]*' | head -1 || echo "10")
    BATCH_TIMEOUT_MS=$(grep '"batchTimeoutMs"' "$CONFIG_FILE" | grep -o '[0-9]*' | head -1 || echo "5000")
    
    debug "Loaded config - Debounce: ${DEBOUNCE_MS}ms, Max events/sec: $MAX_EVENTS_PER_SEC"
}

# Setup logging directory
setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$PID_FILE")"
    
    # Rotate log if too large (>10MB)
    if [ -f "$LOG_FILE" ] && [ $(wc -c < "$LOG_FILE") -gt 10485760 ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        log "Log file rotated"
    fi
}

# Check if agent core is available
check_agent_core() {
    if [ ! -f "$AGENT_CORE" ]; then
        error "LocalAgent core not found at $AGENT_CORE"
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
    fi
    
    # Test agent core
    if ! node "$AGENT_CORE" test &> /dev/null; then
        warn "Agent core test failed - continuing anyway"
    fi
}

# Event processing functions
process_event() {
    local event_type="$1"
    local file_path="$2"
    local timestamp="$3"
    
    debug "Processing event: $event_type on $file_path"
    
    # Basic filtering - skip if file should be ignored
    if should_ignore_file "$file_path"; then
        debug "Ignoring file: $file_path"
        return 0
    fi
    
    # Rate limiting check
    if ! check_rate_limit; then
        warn "Rate limit exceeded, skipping event"
        return 0
    fi
    
    # Trigger the agent
    trigger_agent "$event_type" "$file_path" "$timestamp"
}

should_ignore_file() {
    local file_path="$1"
    
    # Check against common ignore patterns
    case "$file_path" in
        *.log|*.tmp|*/.git/*|*/node_modules/*|*/.localagent/logs/*|*/.localagent/cache/*|*/.DS_Store|*.pyc|*/__pycache__/*|*/coverage/*|*/dist/*|*/build/*|*/target/*)
            return 0  # Should ignore
            ;;
        *)
            return 1  # Should not ignore
            ;;
    esac
}

# Simple rate limiting
RATE_LIMIT_FILE="/tmp/localagent_rate_limit"
check_rate_limit() {
    local current_time=$(date +%s)
    local window_start=$((current_time - 1))  # 1 second window
    
    # Simple rate limiting using timestamp file
    if [ -f "$RATE_LIMIT_FILE" ]; then
        local last_event=$(cat "$RATE_LIMIT_FILE" 2>/dev/null || echo "0")
        if [ $((current_time - last_event)) -lt 1 ]; then
            return 1  # Rate limited
        fi
    fi
    
    # Update timestamp
    echo "$current_time" > "$RATE_LIMIT_FILE"
    return 0
}

# Trigger the LocalAgent
trigger_agent() {
    local event_type="$1"
    local file_path="$2"
    local timestamp="$3"
    
    debug "Triggering agent for $event_type on $file_path"
    
    # Call the agent asynchronously
    (
        cd "$PROJECT_ROOT"
        node -e "
        const LocalAgent = require('$AGENT_CORE');
        const agent = new LocalAgent();
        
        // Handle the file event
        agent.handleFileEvent('$event_type', '$file_path', { timestamp: '$timestamp' })
            .then(() => {
                console.log('Agent processing completed');
            })
            .catch(error => {
                console.error('Agent processing failed:', error.message);
            });
        " 2>&1 | while read line; do
            log "Agent: $line"
        done
    ) &
    
    # Store the background process PID for potential cleanup
    local agent_pid=$!
    debug "Started agent process: $agent_pid"
}

# Platform-specific file watching implementations

# macOS file watching using fswatch
watch_files_macos() {
    log "Starting macOS file watcher using fswatch..."
    
    if ! command -v fswatch &> /dev/null; then
        error "fswatch not found. Install with: brew install fswatch"
    fi
    
    # Prepare ignore patterns for fswatch
    local exclude_args=""
    exclude_args="$exclude_args --exclude='\\.git/'"
    exclude_args="$exclude_args --exclude='node_modules/'"
    exclude_args="$exclude_args --exclude='\\.localagent/logs/'"
    exclude_args="$exclude_args --exclude='\\.localagent/cache/'"
    exclude_args="$exclude_args --exclude='\\.DS_Store'"
    exclude_args="$exclude_args --exclude='\\.log$'"
    exclude_args="$exclude_args --exclude='\\.tmp$'"
    
    # Start fswatch with proper event handling
    eval "fswatch -r -l ${DEBOUNCE_MS} --event Created --event Updated --event Removed --event Renamed $exclude_args '$PROJECT_ROOT'" | while read file; do
        if [ -n "$file" ] && [ "$file" != "$PROJECT_ROOT" ]; then
            # Determine event type based on file existence
            local event_type="modify"
            if [ ! -e "$file" ]; then
                event_type="delete"
            elif [ -f "$file" ] && [ $(stat -f %c "$file" 2>/dev/null || echo 0) -gt $(($(date +%s) - 2)) ]; then
                event_type="create"
            fi
            
            local relative_path="${file#$PROJECT_ROOT/}"
            local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            
            process_event "$event_type" "$relative_path" "$timestamp"
        fi
    done
}

# Linux file watching using inotifywait
watch_files_linux() {
    log "Starting Linux file watcher using inotifywait..."
    
    if ! command -v inotifywait &> /dev/null; then
        error "inotifywait not found. Install with: apt-get install inotify-tools"
    fi
    
    # Prepare exclude patterns for inotifywait
    local exclude_args=""
    exclude_args="$exclude_args --exclude='\.git/'"
    exclude_args="$exclude_args --exclude='node_modules/'"
    exclude_args="$exclude_args --exclude='\.localagent/logs/'"
    exclude_args="$exclude_args --exclude='\.localagent/cache/'"
    exclude_args="$exclude_args --exclude='\.DS_Store'"
    exclude_args="$exclude_args --exclude='\.log$'"
    exclude_args="$exclude_args --exclude='\.tmp$'"
    
    # Start inotifywait with proper event handling
    eval "inotifywait -m -r -e create,modify,delete,move $exclude_args '$PROJECT_ROOT'" | while read path action file; do
        if [ -n "$file" ]; then
            local event_type="modify"
            case "$action" in
                CREATE*) event_type="create" ;;
                DELETE*) event_type="delete" ;;
                MOVE*) event_type="move" ;;
                MODIFY*) event_type="modify" ;;
            esac
            
            local full_path="$path$file"
            local relative_path="${full_path#$PROJECT_ROOT/}"
            local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            
            process_event "$event_type" "$relative_path" "$timestamp"
        fi
    done
}

# Fallback polling-based watcher
watch_files_polling() {
    log "Starting fallback polling-based file watcher..."
    warn "Using polling mode - this is less efficient than native file watching"
    
    # Simple polling implementation
    declare -A file_timestamps
    
    while true; do
        # Find files and check their modification times
        find "$PROJECT_ROOT" -type f \( \
            -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o \
            -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o \
            -name "*.cpp" -o -name "*.c" -o -name "*.php" -o -name "*.rb" -o \
            -name "*.swift" -o -name "*.kt" -o -name "*.json" -o -name "*.yaml" -o \
            -name "*.yml" -o -name "*.toml" -o -name "*.md" -o -name "package.json" -o \
            -name "Cargo.toml" -o -name "pom.xml" -o -name "Makefile" -o -name "Dockerfile" \
        \) ! -path "*/.git/*" ! -path "*/node_modules/*" ! -path "*/.localagent/logs/*" ! -path "*/.localagent/cache/*" | while read file; do
            
            if [ -f "$file" ]; then
                local current_timestamp=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null || echo 0)
                local stored_timestamp="${file_timestamps[$file]:-0}"
                
                if [ "$current_timestamp" != "$stored_timestamp" ]; then
                    file_timestamps["$file"]="$current_timestamp"
                    
                    if [ "$stored_timestamp" != "0" ]; then
                        local relative_path="${file#$PROJECT_ROOT/}"
                        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
                        process_event "modify" "$relative_path" "$timestamp"
                    fi
                fi
            fi
        done
        
        sleep 2  # Poll every 2 seconds
    done
}

# Process management functions
start_daemon() {
    log "Starting LocalAgent File Watcher Daemon..."
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            error "File watcher already running with PID $old_pid"
        else
            warn "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    
    # Setup signal handlers for graceful shutdown
    trap 'shutdown_daemon' SIGINT SIGTERM
    
    # Store our PID
    echo $$ > "$PID_FILE"
    log "File watcher started with PID $$"
    
    # Start the appropriate file watcher based on OS
    case "$OS" in
        "macos")
            watch_files_macos
            ;;
        "linux")
            watch_files_linux
            ;;
        *)
            watch_files_polling
            ;;
    esac
}

shutdown_daemon() {
    log "Shutting down File Watcher Daemon..."
    
    # Kill any running agent processes
    pkill -f "local-agent-core.js" 2>/dev/null || true
    
    # Remove PID file
    rm -f "$PID_FILE"
    
    log "File Watcher Daemon stopped"
    exit 0
}

stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping File Watcher Daemon (PID: $pid)..."
            kill "$pid"
            
            # Wait for process to stop
            local timeout=10
            while kill -0 "$pid" 2>/dev/null && [ $timeout -gt 0 ]; do
                sleep 1
                ((timeout--))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                warn "Process didn't stop gracefully, forcing kill..."
                kill -9 "$pid"
            fi
            
            rm -f "$PID_FILE"
            log "File Watcher Daemon stopped"
        else
            warn "PID file exists but process not running"
            rm -f "$PID_FILE"
        fi
    else
        warn "File Watcher Daemon is not running"
    fi
}

get_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "File Watcher Daemon is running (PID: $pid)"
            
            # Show recent log entries
            echo ""
            echo "Recent activity:"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "No recent activity"
            
            return 0
        else
            warn "PID file exists but process not running"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        warn "File Watcher Daemon is not running"
        return 1
    fi
}

# Main script logic
main() {
    detect_os
    setup_logging
    load_config
    check_agent_core
    
    case "${1:-start}" in
        "start")
            start_daemon
            ;;
        "stop")
            stop_daemon
            ;;
        "restart")
            stop_daemon
            sleep 2
            start_daemon
            ;;
        "status")
            get_status
            ;;
        "logs")
            tail -f "$LOG_FILE"
            ;;
        "test")
            log "Testing file watcher configuration..."
            echo "Test file content" > test-file.tmp
            sleep 2
            rm -f test-file.tmp
            log "Test completed - check logs for agent responses"
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs|test}"
            echo "  start   - Start the file watcher daemon"
            echo "  stop    - Stop the file watcher daemon"
            echo "  restart - Restart the file watcher daemon"
            echo "  status  - Show daemon status"
            echo "  logs    - Follow daemon logs"
            echo "  test    - Test the watcher with a temporary file"
            exit 1
            ;;
    esac
}

# Enable debug mode if DEBUG environment variable is set
if [ "$DEBUG" = "1" ]; then
    set -x
fi

# Run main function with all arguments
main "$@"