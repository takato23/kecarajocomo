# GPT Training Data Collection Scripts

## Overview
This collection of scripts helps gather and process documentation from various sources for GPT training purposes.

## Components

### 1. `assemble.py` - Main Processing Script
- Clones repositories
- Extracts YouTube subtitles
- Processes markdown and documentation files
- Outputs structured data in multiple formats

### 2. `collect_data.sh` - Bash Automation Script
- Checks prerequisites
- Installs dependencies
- Clones repositories
- Downloads YouTube subtitles
- Runs the Python processor

### 3. `requirements.txt` - Python Dependencies
- yt-dlp: YouTube subtitle extraction
- pandocfilters: Document processing
- beautifulsoup4: HTML parsing
- requests: HTTP requests

## Usage

### Quick Start
```bash
# Make script executable and run
chmod +x collect_data.sh
./collect_data.sh
```

### Manual Steps
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run Python script directly
python3 assemble.py
```

### Adding More Sources

#### Add YouTube Videos
Edit `assemble.py` and add URLs to the `youtube_urls` list in the `main()` function:
```python
youtube_urls = [
    'https://www.youtube.com/watch?v=VIDEO_ID_1',
    'https://www.youtube.com/watch?v=VIDEO_ID_2',
    # Add more URLs here
]
```

#### Add GitHub Repositories
Edit `assemble.py` and add to the `self.repos` dictionary in `DataCollector.__init__()`:
```python
'new_repo': {
    'url': 'https://github.com/owner/repo',
    'dir': 'local_dir_name',
    'patterns': ['*.md', '*.txt']
}
```

## Output Files

The script creates a `training_data/` directory with:

- **training_data.json**: Structured JSON with metadata
- **training_data.jsonl**: One document per line (for streaming)
- **training_data_combined.txt**: All text combined
- **statistics.json**: Collection statistics
- **[video_id]_transcript.txt**: Clean YouTube transcripts

## Data Sources Included

1. **Google Web Fundamentals**: Modern web development best practices
2. **OWASP CheatSheets**: Security guidelines and practices
3. **Prompt Engineering Guide**: AI prompting techniques
4. **Cursor Documentation**: Code editor documentation
5. **SuperClaude**: Claude enhancement framework
6. **BMAD Method**: Development methodology

## Customization

### Processing Options
Modify `DataCollector` class to:
- Change file patterns
- Add metadata extraction
- Implement custom cleaning rules
- Add new output formats

### Filtering Content
Add filters in `_process_single_file()` to:
- Skip certain files
- Extract specific sections
- Apply content transformations

## Troubleshooting

### Common Issues

1. **yt-dlp not found**
   ```bash
   pip install --upgrade yt-dlp
   ```

2. **Git clone fails**
   - Check internet connection
   - Verify repository URLs
   - Try manual clone with: `git clone --depth=1 URL`

3. **Python import errors**
   ```bash
   pip install -r requirements.txt --force-reinstall
   ```

4. **Encoding errors**
   - Script handles UTF-8 with error ignoring
   - Check source files for unusual encodings

## Notes

- Uses shallow clones (`--depth=1`) to save bandwidth
- Processes files in parallel when possible
- Handles large repositories efficiently
- Preserves metadata when available
- Cleans and normalizes text for training