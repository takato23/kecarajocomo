#!/bin/bash

# GPT Training Data Collection Script
# This script clones repositories and downloads YouTube subtitles

set -e  # Exit on error

echo "=== GPT Training Data Collection ==="
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists git; then
    echo "Error: git is not installed"
    exit 1
fi

if ! command_exists python3; then
    echo "Error: python3 is not installed"
    exit 1
fi

if ! command_exists yt-dlp; then
    echo "Warning: yt-dlp not found. Installing..."
    pip install yt-dlp
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt || {
    echo "Error: Failed to install dependencies"
    echo "Trying to install individually..."
    pip install yt-dlp pandocfilters bs4 requests
}

echo
echo "=== Step 1: Cloning Repositories ==="
echo

# Function to clone or update repository
clone_or_update() {
    local url=$1
    local dir=$2
    local name=$3
    
    if [ -d "$dir" ]; then
        echo "Repository $name already exists in $dir"
        echo "Updating..."
        cd "$dir"
        git pull --depth=1 || echo "Warning: Could not update $name"
        cd ..
    else
        echo "Cloning $name..."
        git clone --depth=1 "$url" "$dir" || echo "Error: Failed to clone $name"
    fi
    echo
}

# Clone all repositories
clone_or_update "https://github.com/google/WebFundamentals" "wf" "Web Fundamentals"
clone_or_update "https://github.com/OWASP/CheatSheetSeries" "owasp" "OWASP CheatSheets"
clone_or_update "https://github.com/dair-ai/Prompt-Engineering-Guide" "prompts" "Prompt Engineering Guide"
clone_or_update "https://github.com/getcursor/docs" "cursordocs" "Cursor Documentation"
clone_or_update "https://github.com/NomenAK/SuperClaude" "superclaude" "SuperClaude"
clone_or_update "https://github.com/bmadcode/BMAD-METHOD" "bmad" "BMAD Method"

echo
echo "=== Step 2: Downloading YouTube Subtitles ==="
echo

# Create directory for subtitles
mkdir -p training_data

# Example YouTube videos - replace with actual URLs
YOUTUBE_URLS=(
    "https://www.youtube.com/watch?v=IO25Keynote"
    # Add more YouTube URLs here
)

for url in "${YOUTUBE_URLS[@]}"; do
    echo "Downloading subtitles from: $url"
    yt-dlp --skip-download --write-auto-sub --sub-format vtt -o 'training_data/%(title)s.%(ext)s' "$url" || {
        echo "Warning: Failed to download subtitles from $url"
    }
    echo
done

echo
echo "=== Step 3: Processing Data ==="
echo

# Run the Python processing script
python3 assemble.py || {
    echo "Error: Failed to run assemble.py"
    echo "Please check the error messages above"
    exit 1
}

echo
echo "=== Data Collection Complete ==="
echo "Check the 'training_data' directory for processed files:"
ls -la training_data/

echo
echo "Summary files created:"
echo "- training_data.json: Structured JSON format"
echo "- training_data.jsonl: One document per line format"
echo "- training_data_combined.txt: Combined text format"
echo "- statistics.json: Collection statistics"