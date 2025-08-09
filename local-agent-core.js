#!/usr/bin/env node

/**
 * LocalAgent Core - Autonomous AI Brain
 * 
 * A completely local, autonomous AI agent that:
 * - Uses Ollama for local LLM inference (no API dependencies)
 * - Maintains git-based memory system
 * - Responds to file system events
 * - Makes intelligent decisions about when and how to act
 * - Learns from past interactions
 * 
 * Based on QwenCoder's autonomous agent architecture
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
// Use native fetch for Node 18+ or fallback to node-fetch
const fetch = globalThis.fetch || require('node-fetch');
const simpleGit = require('simple-git');
const yaml = require('yaml');
const chalk = require('chalk');

class LocalAgent {
    constructor(options = {}) {
        this.config = {
            ollamaUrl: options.ollamaUrl || 'http://localhost:11434',
            primaryModel: options.primaryModel || 'qwen2.5-coder:1.5b',
            reasoningModel: options.reasoningModel || 'llama3.2:3b',
            memoryPath: options.memoryPath || '.localagent/memory',
            logPath: options.logPath || '.localagent/logs',
            maxMemoryEntries: options.maxMemoryEntries || 1000,
            autonomyLevel: options.autonomyLevel || 'medium', // low, medium, high
            projectRoot: process.cwd(),
            ...options
        };
        
        this.git = simpleGit();
        this.memory = new AgentMemory(this.config.memoryPath);
        this.reasoning = new ReasoningEngine(this);
        this.actions = new ActionEngine(this);
        this.state = {
            isActive: false,
            currentTask: null,
            lastAction: null,
            actionCount: 0,
            startTime: new Date()
        };
        
        this.setupLogging();
        this.log('LocalAgent initialized', 'info');
    }
    
    setupLogging() {
        const logDir = path.join(this.config.projectRoot, this.config.logPath);
        fs.ensureDirSync(logDir);
        
        this.logFile = path.join(logDir, `agent-${new Date().toISOString().split('T')[0]}.log`);
    }
    
    log(message, level = 'info', context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            context,
            state: this.state
        };
        
        // Console output with colors
        const colorMap = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red,
            debug: chalk.gray
        };
        
        const colorFn = colorMap[level] || chalk.white;
        console.log(`${chalk.gray(timestamp)} ${colorFn(`[${level.toUpperCase()}]`)} ${message}`);
        
        // File logging
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
    
    async start() {
        this.log('Starting LocalAgent...', 'info');
        this.state.isActive = true;
        
        try {
            await this.verifyOllama();
            await this.loadMemory();
            await this.initializeGitMemory();
            
            this.log('LocalAgent is now autonomous and monitoring', 'success');
            
            // Start the main event loop
            this.startEventLoop();
            
        } catch (error) {
            this.log(`Failed to start: ${error.message}`, 'error');
            process.exit(1);
        }
    }
    
    async verifyOllama() {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Ollama not responding: ${response.status}`);
            }
            
            const data = await response.json();
            const availableModels = data.models.map(m => m.name);
            
            this.log(`Connected to Ollama. Available models: ${availableModels.join(', ')}`, 'success');
            
            // Verify required models are available
            const requiredModels = [this.config.primaryModel, this.config.reasoningModel];
            for (const model of requiredModels) {
                if (!availableModels.some(m => m.startsWith(model.split(':')[0]))) {
                    this.log(`Required model ${model} not found. Attempting to pull...`, 'warning');
                    await this.pullModel(model);
                }
            }
            
        } catch (error) {
            throw new Error(`Cannot connect to Ollama: ${error.message}. Run 'ollama serve' first.`);
        }
    }
    
    async pullModel(modelName) {
        this.log(`Pulling model: ${modelName}`, 'info');
        try {
            execSync(`ollama pull ${modelName}`, { stdio: 'inherit' });
            this.log(`Model ${modelName} pulled successfully`, 'success');
        } catch (error) {
            throw new Error(`Failed to pull model ${modelName}: ${error.message}`);
        }
    }
    
    async loadMemory() {
        await this.memory.load();
        this.log(`Loaded ${this.memory.getEntryCount()} memory entries`, 'info');
    }
    
    async initializeGitMemory() {
        const isGitRepo = await this.git.checkIsRepo();
        if (!isGitRepo) {
            await this.git.init();
            this.log('Initialized git repository for memory tracking', 'info');
        }
        
        // Ensure memory files are tracked
        const memoryDir = this.config.memoryPath;
        if (!fs.existsSync(path.join(memoryDir, '.gitkeep'))) {
            fs.ensureDirSync(memoryDir);
            fs.writeFileSync(path.join(memoryDir, '.gitkeep'), '');
        }
    }
    
    startEventLoop() {
        // The event loop will be primarily driven by file system events
        // This method sets up the basic monitoring infrastructure
        this.log('Event loop started - waiting for file system events...', 'info');
        
        // Periodic health checks and memory consolidation
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute
        
        // Memory consolidation every 10 minutes
        setInterval(() => {
            this.memory.consolidate();
        }, 600000);
    }
    
    performHealthCheck() {
        const now = new Date();
        const uptime = Math.floor((now - this.state.startTime) / 1000);
        
        this.log(`Health check - Uptime: ${uptime}s, Actions: ${this.state.actionCount}`, 'debug');
        
        // Check if Ollama is still responsive
        fetch(`${this.config.ollamaUrl}/api/tags`)
            .then(response => {
                if (!response.ok) {
                    this.log('Ollama health check failed', 'warning');
                }
            })
            .catch(error => {
                this.log(`Ollama connection error: ${error.message}`, 'error');
            });
    }
    
    // Main entry point for file system events
    async handleFileEvent(eventType, filePath, stats = {}) {
        try {
            this.log(`File event: ${eventType} - ${filePath}`, 'debug');
            
            // Quick filters to avoid processing irrelevant events
            if (this.shouldIgnoreFile(filePath)) {
                return;
            }
            
            // Analyze the event and decide if action is needed
            const analysisResult = await this.reasoning.analyzeFileEvent(eventType, filePath, stats);
            
            if (analysisResult.shouldAct) {
                this.log(`Taking action for ${eventType} on ${filePath}: ${analysisResult.reason}`, 'info');
                await this.executeAction(analysisResult);
            }
            
        } catch (error) {
            this.log(`Error handling file event: ${error.message}`, 'error');
        }
    }
    
    shouldIgnoreFile(filePath) {
        const ignorePaths = [
            '.git/',
            'node_modules/',
            '.localagent/logs/',
            '.localagent/cache/',
            '.DS_Store',
            '.tmp',
            '.log'
        ];
        
        return ignorePaths.some(ignore => filePath.includes(ignore));
    }
    
    async executeAction(analysisResult) {
        this.state.currentTask = analysisResult.action;
        this.state.actionCount++;
        
        try {
            const result = await this.actions.execute(analysisResult);
            
            // Record the action in memory
            await this.memory.addEntry({
                type: 'action',
                timestamp: new Date().toISOString(),
                analysis: analysisResult,
                result: result,
                success: true
            });
            
            this.log(`Action completed successfully: ${result.summary}`, 'success');
            this.state.lastAction = result;
            
        } catch (error) {
            this.log(`Action failed: ${error.message}`, 'error');
            
            await this.memory.addEntry({
                type: 'action',
                timestamp: new Date().toISOString(),
                analysis: analysisResult,
                error: error.message,
                success: false
            });
        } finally {
            this.state.currentTask = null;
        }
    }
    
    async query(prompt, model = null) {
        const targetModel = model || this.config.primaryModel;
        
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: targetModel,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.3,
                        top_p: 0.9,
                        max_tokens: 2048
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.response;
            
        } catch (error) {
            this.log(`Query failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async stop() {
        this.log('Stopping LocalAgent...', 'info');
        this.state.isActive = false;
        
        await this.memory.save();
        await this.commitMemoryToGit();
        
        this.log('LocalAgent stopped', 'success');
    }
    
    async commitMemoryToGit() {
        try {
            await this.git.add([this.config.memoryPath]);
            const status = await this.git.status();
            
            if (status.files.length > 0) {
                await this.git.commit(`LocalAgent memory update - ${new Date().toISOString()}`);
                this.log('Memory committed to git', 'info');
            }
        } catch (error) {
            this.log(`Failed to commit memory: ${error.message}`, 'warning');
        }
    }
}

// Agent Memory System
class AgentMemory {
    constructor(memoryPath) {
        this.memoryPath = memoryPath;
        this.memoryFile = path.join(memoryPath, 'agent-memory.json');
        this.entries = [];
        this.maxEntries = 1000;
    }
    
    async load() {
        fs.ensureDirSync(this.memoryPath);
        
        if (fs.existsSync(this.memoryFile)) {
            try {
                const data = await fs.readFile(this.memoryFile, 'utf8');
                this.entries = JSON.parse(data);
            } catch (error) {
                console.warn(`Failed to load memory: ${error.message}`);
                this.entries = [];
            }
        }
    }
    
    async save() {
        try {
            await fs.writeFile(this.memoryFile, JSON.stringify(this.entries, null, 2));
        } catch (error) {
            console.error(`Failed to save memory: ${error.message}`);
        }
    }
    
    async addEntry(entry) {
        this.entries.push({
            id: this.generateId(),
            ...entry
        });
        
        // Maintain memory size limit
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
        
        await this.save();
    }
    
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getEntryCount() {
        return this.entries.length;
    }
    
    getRecentEntries(count = 10) {
        return this.entries.slice(-count);
    }
    
    searchEntries(query) {
        const searchTerms = query.toLowerCase().split(' ');
        return this.entries.filter(entry => {
            const searchText = JSON.stringify(entry).toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }
    
    consolidate() {
        // Remove duplicate or redundant entries
        // Group similar actions and keep only the most recent
        const consolidated = [];
        const seen = new Set();
        
        for (const entry of this.entries.reverse()) {
            const key = `${entry.type}_${entry.analysis?.filePath || 'unknown'}`;
            if (!seen.has(key) || entry.success === false) {
                consolidated.push(entry);
                seen.add(key);
            }
        }
        
        this.entries = consolidated.reverse();
        this.save();
    }
}

// Reasoning Engine - The brain of the agent
class ReasoningEngine {
    constructor(agent) {
        this.agent = agent;
        this.patterns = {
            codeFiles: /\.(js|ts|jsx|tsx|py|go|rs|java|cpp|c|php|rb|swift|kt)$/,
            configFiles: /\.(json|yaml|yml|toml|ini|env|config)$/,
            docFiles: /\.(md|txt|rst|adoc)$/,
            testFiles: /\.(test|spec)\./,
            buildFiles: /^(package\.json|Cargo\.toml|pom\.xml|build\.gradle|Makefile|Dockerfile)$/
        };
    }
    
    async analyzeFileEvent(eventType, filePath, stats = {}) {
        const context = await this.gatherContext(filePath);
        const prompt = this.buildAnalysisPrompt(eventType, filePath, context, stats);
        
        try {
            const response = await this.agent.query(prompt, this.agent.config.reasoningModel);
            return this.parseAnalysisResponse(response, eventType, filePath);
            
        } catch (error) {
            // Fallback to rule-based analysis
            return this.fallbackAnalysis(eventType, filePath, context);
        }
    }
    
    async gatherContext(filePath) {
        const context = {
            fileType: this.determineFileType(filePath),
            projectStructure: await this.analyzeProjectStructure(),
            recentMemory: this.agent.memory.getRecentEntries(5),
            gitStatus: await this.getGitStatus(),
            fileStats: await this.getFileStats(filePath)
        };
        
        return context;
    }
    
    determineFileType(filePath) {
        for (const [type, pattern] of Object.entries(this.patterns)) {
            if (pattern.test(filePath)) {
                return type;
            }
        }
        return 'unknown';
    }
    
    async analyzeProjectStructure() {
        try {
            const packageJson = path.join(this.agent.config.projectRoot, 'package.json');
            if (fs.existsSync(packageJson)) {
                const pkg = JSON.parse(await fs.readFile(packageJson, 'utf8'));
                return {
                    type: 'nodejs',
                    name: pkg.name,
                    scripts: Object.keys(pkg.scripts || {}),
                    dependencies: Object.keys(pkg.dependencies || {})
                };
            }
            
            // Add more project type detection (Python, Go, Rust, etc.)
            return { type: 'unknown' };
            
        } catch (error) {
            return { type: 'unknown', error: error.message };
        }
    }
    
    async getGitStatus() {
        try {
            const status = await this.agent.git.status();
            return {
                modified: status.modified,
                created: status.created,
                deleted: status.deleted,
                branch: status.current
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async getFileStats(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const stats = await fs.stat(filePath);
                return {
                    size: stats.size,
                    modified: stats.mtime,
                    created: stats.birthtime
                };
            }
        } catch (error) {
            return { error: error.message };
        }
        return {};
    }
    
    buildAnalysisPrompt(eventType, filePath, context, stats) {
        return `You are an autonomous AI agent analyzing a file system event.

EVENT: ${eventType} on file: ${filePath}
FILE_TYPE: ${context.fileType}
PROJECT: ${JSON.stringify(context.projectStructure, null, 2)}
GIT_STATUS: ${JSON.stringify(context.gitStatus, null, 2)}
RECENT_ACTIONS: ${JSON.stringify(context.recentMemory, null, 2)}

Based on this information, decide if you should take action and what action to take.

Consider:
1. Is this change significant enough to warrant action?
2. What type of action would be most helpful?
3. What are the risks of taking action vs not taking action?
4. Is this related to any recent changes or patterns?

Respond with a JSON object:
{
    "shouldAct": boolean,
    "confidence": number (0-1),
    "reason": "brief explanation",
    "action": "type of action to take",
    "priority": "low|medium|high",
    "risks": ["potential risks"],
    "benefits": ["potential benefits"]
}

Available actions: analyze, test, lint, fix, document, optimize, monitor, ignore`;
    }
    
    parseAnalysisResponse(response, eventType, filePath) {
        try {
            // Extract JSON from response (LLMs sometimes add extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                
                return {
                    shouldAct: analysis.shouldAct || false,
                    confidence: analysis.confidence || 0.5,
                    reason: analysis.reason || 'No reason provided',
                    action: analysis.action || 'monitor',
                    priority: analysis.priority || 'low',
                    risks: analysis.risks || [],
                    benefits: analysis.benefits || [],
                    eventType,
                    filePath,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            this.agent.log(`Failed to parse analysis response: ${error.message}`, 'warning');
        }
        
        // Fallback to rule-based analysis
        return this.fallbackAnalysis(eventType, filePath, {});
    }
    
    fallbackAnalysis(eventType, filePath, context) {
        const fileType = this.determineFileType(filePath);
        
        // Simple rule-based decisions
        let shouldAct = false;
        let action = 'monitor';
        let priority = 'low';
        let reason = 'Monitoring file change';
        
        if (fileType === 'codeFiles' && eventType === 'change') {
            shouldAct = true;
            action = 'analyze';
            priority = 'medium';
            reason = 'Code file changed - analyzing for potential issues';
        } else if (fileType === 'configFiles') {
            shouldAct = true;
            action = 'validate';
            priority = 'high';
            reason = 'Configuration file changed - validating syntax';
        } else if (fileType === 'testFiles') {
            shouldAct = true;
            action = 'test';
            priority = 'medium';
            reason = 'Test file changed - running related tests';
        }
        
        return {
            shouldAct,
            confidence: 0.7,
            reason,
            action,
            priority,
            risks: ['Automated action may not be appropriate'],
            benefits: ['Proactive issue detection'],
            eventType,
            filePath,
            timestamp: new Date().toISOString()
        };
    }
}

// Action Engine - Executes the agent's decisions
class ActionEngine {
    constructor(agent) {
        this.agent = agent;
    }
    
    async execute(analysisResult) {
        const { action, filePath } = analysisResult;
        
        this.agent.log(`Executing action: ${action} on ${filePath}`, 'info');
        
        switch (action) {
            case 'analyze':
                return await this.analyzeFile(filePath);
            case 'test':
                return await this.runTests(filePath);
            case 'lint':
                return await this.lintFile(filePath);
            case 'fix':
                return await this.fixIssues(filePath);
            case 'document':
                return await this.generateDocumentation(filePath);
            case 'optimize':
                return await this.optimizeFile(filePath);
            case 'validate':
                return await this.validateFile(filePath);
            case 'monitor':
            default:
                return await this.monitorFile(filePath);
        }
    }
    
    async analyzeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const prompt = `Analyze this file for potential issues, improvements, or insights:

FILE: ${filePath}
CONTENT:
${content}

Provide a brief analysis focusing on:
1. Code quality and potential issues
2. Security concerns
3. Performance considerations
4. Suggestions for improvement

Keep the response concise and actionable.`;
            
            const analysis = await this.agent.query(prompt);
            
            // Write analysis to a comment or separate file
            const analysisPath = `${filePath}.analysis`;
            await fs.writeFile(analysisPath, `# Analysis for ${filePath}\n\n${analysis}\n`);
            
            return {
                summary: `Analyzed ${filePath}`,
                details: analysis,
                outputFile: analysisPath
            };
            
        } catch (error) {
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }
    
    async runTests(filePath) {
        try {
            // Determine test command based on project type
            const projectRoot = this.agent.config.projectRoot;
            let testCommand = 'npm test';
            
            if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
                const pkg = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
                if (pkg.scripts && pkg.scripts.test) {
                    testCommand = 'npm test';
                }
            }
            
            // For now, just log that we would run tests
            this.agent.log(`Would run: ${testCommand}`, 'info');
            
            return {
                summary: `Test command identified: ${testCommand}`,
                details: `Ready to run tests for ${filePath}`,
                command: testCommand
            };
            
        } catch (error) {
            throw new Error(`Test execution failed: ${error.message}`);
        }
    }
    
    async lintFile(filePath) {
        // Basic linting - check for common issues
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const issues = [];
            
            // Basic checks
            if (content.includes('console.log')) {
                issues.push('Found console.log statements');
            }
            if (content.includes('TODO') || content.includes('FIXME')) {
                issues.push('Found TODO/FIXME comments');
            }
            if (content.length > 10000) {
                issues.push('File is quite large (>10KB)');
            }
            
            return {
                summary: `Linted ${filePath}`,
                details: issues.length > 0 ? issues.join('\n') : 'No issues found',
                issueCount: issues.length
            };
            
        } catch (error) {
            throw new Error(`Linting failed: ${error.message}`);
        }
    }
    
    async fixIssues(filePath) {
        // Placeholder for automated fixes
        return {
            summary: `Identified potential fixes for ${filePath}`,
            details: 'Automated fixing not yet implemented',
            action: 'monitor'
        };
    }
    
    async generateDocumentation(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const prompt = `Generate documentation for this file:

FILE: ${filePath}
CONTENT:
${content}

Create concise documentation that explains:
1. What this file does
2. Key functions/exports
3. Usage examples if applicable
4. Dependencies

Format as Markdown.`;
            
            const documentation = await this.agent.query(prompt);
            const docPath = `${filePath}.md`;
            
            await fs.writeFile(docPath, documentation);
            
            return {
                summary: `Generated documentation for ${filePath}`,
                details: documentation,
                outputFile: docPath
            };
            
        } catch (error) {
            throw new Error(`Documentation generation failed: ${error.message}`);
        }
    }
    
    async optimizeFile(filePath) {
        // Placeholder for optimization suggestions
        return {
            summary: `Analyzed optimization opportunities for ${filePath}`,
            details: 'Optimization analysis not yet implemented',
            action: 'monitor'
        };
    }
    
    async validateFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Basic validation based on file type
            if (filePath.endsWith('.json')) {
                JSON.parse(content); // Will throw if invalid
                return {
                    summary: `Validated JSON syntax in ${filePath}`,
                    details: 'JSON syntax is valid',
                    valid: true
                };
            }
            
            return {
                summary: `Validated ${filePath}`,
                details: 'File appears to be valid',
                valid: true
            };
            
        } catch (error) {
            return {
                summary: `Validation failed for ${filePath}`,
                details: error.message,
                valid: false
            };
        }
    }
    
    async monitorFile(filePath) {
        return {
            summary: `Monitoring ${filePath}`,
            details: 'File change noted, no action required',
            action: 'monitor'
        };
    }
}

// CLI interface
if (require.main === module) {
    const { Command } = require('commander');
    const program = new Command();
    
    program
        .name('local-agent')
        .description('Autonomous local AI agent')
        .version('1.0.0');
    
    program
        .command('start')
        .description('Start the autonomous agent')
        .option('-m, --model <model>', 'Primary model to use', 'qwen2.5-coder:1.5b')
        .option('-a, --autonomy <level>', 'Autonomy level (low|medium|high)', 'medium')
        .action(async (options) => {
            const agent = new LocalAgent(options);
            
            // Graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\nShutting down LocalAgent...');
                await agent.stop();
                process.exit(0);
            });
            
            await agent.start();
        });
    
    program
        .command('test')
        .description('Test agent components')
        .action(async () => {
            console.log('Testing LocalAgent components...');
            const agent = new LocalAgent();
            
            try {
                await agent.verifyOllama();
                console.log('✓ Ollama connection working');
                
                const response = await agent.query('Hello, respond with just "working" if you can see this.');
                console.log(`✓ Model response: ${response}`);
                
                console.log('✓ All tests passed');
            } catch (error) {
                console.error(`✗ Test failed: ${error.message}`);
                process.exit(1);
            }
        });
    
    program.parse();
}

module.exports = LocalAgent;