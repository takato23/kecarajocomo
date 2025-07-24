#!/usr/bin/env python3
"""
Data Collection and Processing Script for GPT Training
Collects and processes documentation from various sources
"""

import os
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Any
import subprocess
import logging
from datetime import datetime

# Third-party imports
try:
    from bs4 import BeautifulSoup
    import requests
    import pandocfilters
except ImportError:
    print("Error: Required packages not installed.")
    print("Please run: pip install yt-dlp pandocfilters bs4 requests")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataCollector:
    """Main class for collecting and processing training data"""
    
    def __init__(self, output_dir: str = "training_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.repos = {
            'web_fundamentals': {
                'url': 'https://github.com/google/WebFundamentals',
                'dir': 'wf',
                'patterns': ['*.md', '*.html']
            },
            'owasp': {
                'url': 'https://github.com/OWASP/CheatSheetSeries',
                'dir': 'owasp',
                'patterns': ['*.md']
            },
            'prompt_engineering': {
                'url': 'https://github.com/dair-ai/Prompt-Engineering-Guide',
                'dir': 'prompts',
                'patterns': ['*.md']
            },
            'cursor_docs': {
                'url': 'https://github.com/getcursor/docs',
                'dir': 'cursordocs',
                'patterns': ['*.md', '*.mdx']
            },
            'superclaude': {
                'url': 'https://github.com/NomenAK/SuperClaude',
                'dir': 'superclaude',
                'patterns': ['*.md']
            },
            'bmad_method': {
                'url': 'https://github.com/bmadcode/BMAD-METHOD',
                'dir': 'bmad',
                'patterns': ['*.md']
            }
        }
        
    def clone_repositories(self) -> None:
        """Clone all configured repositories"""
        logger.info("Starting repository cloning...")
        
        for name, config in self.repos.items():
            repo_dir = Path(config['dir'])
            
            if repo_dir.exists():
                logger.info(f"Repository {name} already exists, skipping...")
                continue
                
            logger.info(f"Cloning {name} from {config['url']}...")
            cmd = ['git', 'clone', '--depth=1', config['url'], config['dir']]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                logger.info(f"Successfully cloned {name}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to clone {name}: {e}")
                
    def extract_youtube_subtitles(self, video_urls: List[str]) -> None:
        """Extract subtitles from YouTube videos"""
        logger.info("Extracting YouTube subtitles...")
        
        for url in video_urls:
            video_id = self._extract_video_id(url)
            if not video_id:
                logger.error(f"Could not extract video ID from {url}")
                continue
                
            output_template = str(self.output_dir / f"{video_id}.%(ext)s")
            cmd = [
                'yt-dlp',
                '--skip-download',
                '--write-auto-sub',
                '--sub-format', 'vtt',
                '-o', output_template,
                url
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                logger.info(f"Successfully extracted subtitles for {video_id}")
                
                # Process VTT file to extract clean text
                vtt_file = self.output_dir / f"{video_id}.en.vtt"
                if vtt_file.exists():
                    self._process_vtt_file(vtt_file, video_id)
                    
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to extract subtitles from {url}: {e}")
                
    def _extract_video_id(self, url: str) -> str:
        """Extract YouTube video ID from URL"""
        patterns = [
            r'youtube\.com/watch\?v=([^&]+)',
            r'youtu\.be/([^?]+)',
            r'youtube\.com/embed/([^?]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return ""
        
    def _process_vtt_file(self, vtt_file: Path, video_id: str) -> None:
        """Process VTT subtitle file to extract clean text"""
        with open(vtt_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Remove timestamps and formatting
        lines = content.split('\n')
        clean_lines = []
        
        for line in lines:
            # Skip timestamps and empty lines
            if '-->' in line or line.strip() == '' or line.startswith('WEBVTT'):
                continue
            # Remove HTML tags
            line = re.sub(r'<[^>]+>', '', line)
            clean_lines.append(line.strip())
            
        # Join and deduplicate
        text = ' '.join(clean_lines)
        text = re.sub(r'\s+', ' ', text)
        
        # Save clean text
        output_file = self.output_dir / f"{video_id}_transcript.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
            
        logger.info(f"Saved clean transcript to {output_file}")
        
    def process_markdown_files(self) -> Dict[str, List[Dict[str, Any]]]:
        """Process all markdown files from cloned repositories"""
        logger.info("Processing markdown files...")
        all_content = {}
        
        for name, config in self.repos.items():
            repo_dir = Path(config['dir'])
            if not repo_dir.exists():
                logger.warning(f"Repository {name} not found, skipping...")
                continue
                
            content_list = []
            for pattern in config['patterns']:
                files = list(repo_dir.rglob(pattern))
                logger.info(f"Found {len(files)} {pattern} files in {name}")
                
                for file_path in files:
                    try:
                        content = self._process_single_file(file_path, name)
                        if content:
                            content_list.append(content)
                    except Exception as e:
                        logger.error(f"Error processing {file_path}: {e}")
                        
            all_content[name] = content_list
            logger.info(f"Processed {len(content_list)} files from {name}")
            
        return all_content
        
    def _process_single_file(self, file_path: Path, source: str) -> Dict[str, Any]:
        """Process a single markdown/documentation file"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # Extract metadata if present
        metadata = self._extract_metadata(content)
        
        # Clean content
        clean_content = self._clean_content(content)
        
        return {
            'source': source,
            'file_path': str(file_path),
            'content': clean_content,
            'metadata': metadata,
            'word_count': len(clean_content.split()),
            'timestamp': datetime.now().isoformat()
        }
        
    def _extract_metadata(self, content: str) -> Dict[str, Any]:
        """Extract metadata from markdown frontmatter"""
        metadata = {}
        
        # Check for YAML frontmatter
        if content.startswith('---'):
            try:
                end_index = content.find('---', 3)
                if end_index > 0:
                    frontmatter = content[3:end_index].strip()
                    # Simple parsing (could use yaml library for more robust parsing)
                    for line in frontmatter.split('\n'):
                        if ':' in line:
                            key, value = line.split(':', 1)
                            metadata[key.strip()] = value.strip()
            except Exception:
                pass
                
        return metadata
        
    def _clean_content(self, content: str) -> str:
        """Clean and normalize content"""
        # Remove excessive whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        
        # Remove common markdown artifacts
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        
        return content.strip()
        
    def save_processed_data(self, all_content: Dict[str, List[Dict[str, Any]]]) -> None:
        """Save processed data in various formats"""
        logger.info("Saving processed data...")
        
        # Save as JSON
        json_file = self.output_dir / 'training_data.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(all_content, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved JSON data to {json_file}")
        
        # Save as JSONL (one document per line)
        jsonl_file = self.output_dir / 'training_data.jsonl'
        with open(jsonl_file, 'w', encoding='utf-8') as f:
            for source, documents in all_content.items():
                for doc in documents:
                    f.write(json.dumps(doc, ensure_ascii=False) + '\n')
        logger.info(f"Saved JSONL data to {jsonl_file}")
        
        # Save combined text file
        text_file = self.output_dir / 'training_data_combined.txt'
        with open(text_file, 'w', encoding='utf-8') as f:
            for source, documents in all_content.items():
                f.write(f"\n\n{'='*50}\n")
                f.write(f"SOURCE: {source}\n")
                f.write(f"{'='*50}\n\n")
                
                for doc in documents:
                    f.write(f"\n--- {doc['file_path']} ---\n\n")
                    f.write(doc['content'])
                    f.write('\n\n')
        logger.info(f"Saved combined text to {text_file}")
        
        # Generate statistics
        self._generate_statistics(all_content)
        
    def _generate_statistics(self, all_content: Dict[str, List[Dict[str, Any]]]) -> None:
        """Generate statistics about the collected data"""
        stats = {
            'total_documents': 0,
            'total_words': 0,
            'sources': {}
        }
        
        for source, documents in all_content.items():
            doc_count = len(documents)
            word_count = sum(doc['word_count'] for doc in documents)
            
            stats['total_documents'] += doc_count
            stats['total_words'] += word_count
            stats['sources'][source] = {
                'document_count': doc_count,
                'word_count': word_count
            }
            
        stats_file = self.output_dir / 'statistics.json'
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
            
        logger.info("Data collection statistics:")
        logger.info(f"Total documents: {stats['total_documents']}")
        logger.info(f"Total words: {stats['total_words']:,}")
        for source, source_stats in stats['sources'].items():
            logger.info(f"  {source}: {source_stats['document_count']} docs, {source_stats['word_count']:,} words")
            
    def run(self, youtube_urls: List[str] = None) -> None:
        """Run the complete data collection pipeline"""
        logger.info("Starting data collection pipeline...")
        
        # Clone repositories
        self.clone_repositories()
        
        # Extract YouTube subtitles
        if youtube_urls:
            self.extract_youtube_subtitles(youtube_urls)
        
        # Process markdown files
        all_content = self.process_markdown_files()
        
        # Save processed data
        self.save_processed_data(all_content)
        
        logger.info("Data collection pipeline completed!")


def main():
    """Main entry point"""
    # Example YouTube URLs - add more as needed
    youtube_urls = [
        'https://www.youtube.com/watch?v=IO25Keynote',  # Replace with actual video ID
        # Add more YouTube URLs here
    ]
    
    collector = DataCollector()
    collector.run(youtube_urls)


if __name__ == "__main__":
    main()