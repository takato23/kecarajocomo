#!/usr/bin/env python3
"""
Fast Dataset Cleaner - Remove obvious junk quickly
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging
from tqdm import tqdm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FastCleaner:
    """Fast cleaning focusing on obvious junk removal"""
    
    def __init__(self, input_dir: str = "training_data_expanded", output_dir: str = "training_data_clean"):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Quick filters
        self.min_words = 30
        self.max_words = 20000
        self.stats = {'total': 0, 'kept': 0, 'filtered': 0}
        
        # Junk patterns - obvious stuff to remove
        self.junk_patterns = [
            r'reddit\.com',
            r'upvote|downvote|karma',
            r'permalink|save comment|give award',
            r'continue this thread|more replies',
            r'sort by:|new comments|best comments',
            r'removed by moderator|deleted by user',
            r'account suspended|shadowbanned',
            r'[0-9]+\s+points?\s+ago',
            r'submitted\s+[0-9]+\s+(hour|day|week|month)s?\s+ago',
            r'share\s+report\s+save',
            r'load more comments',
            r'view discussions in'
        ]
        
        # High-quality sources to keep
        self.good_sources = {
            'mdn_content', 'owasp', 'openai_cookbook', 'langchain', 
            'huggingface_course', 'react_docs', 'vue_docs', 'nextjs_docs',
            'kubernetes_docs', 'system_design_primer', 'clean_code_javascript',
            'javascript_algorithms', 'python_patterns', 'web_fundamentals'
        }
        
    def is_junk(self, content: str) -> bool:
        """Quick junk detection"""
        content_lower = content.lower()
        
        # Check for obvious junk patterns
        for pattern in self.junk_patterns:
            if re.search(pattern, content_lower):
                return True
                
        # Check for excessive broken characters
        if content.count('�') > len(content) * 0.05:
            return True
            
        # Check for excessive HTML/markup
        if content.count('<') > len(content) * 0.1:
            return True
            
        return False
        
    def clean_text(self, text: str) -> str:
        """Quick text cleaning"""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove URLs
        text = re.sub(r'https?://[^\s]+', '[URL]', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove broken characters
        text = re.sub(r'[����]', '', text)
        
        return text.strip()
        
    def should_keep(self, doc: Dict[str, Any]) -> bool:
        """Quick decision on whether to keep document"""
        content = doc.get('content', '')
        source = doc.get('source', '')
        
        # Empty content
        if not content or len(content.strip()) < 50:
            return False
            
        # Word count filter
        words = content.split()
        if len(words) < self.min_words or len(words) > self.max_words:
            return False
            
        # Junk detection
        if self.is_junk(content):
            return False
            
        # Prioritize good sources
        if source in self.good_sources:
            return True
            
        # Additional quality checks for other sources
        if source not in self.good_sources:
            # Must have some technical keywords
            tech_keywords = ['function', 'class', 'import', 'const', 'let', 'def', 'public', 'private', 
                           'algorithm', 'implementation', 'documentation', 'example', 'tutorial', 'guide',
                           'API', 'method', 'parameter', 'return', 'error', 'testing', 'security']
            
            if not any(keyword in content.lower() for keyword in tech_keywords):
                return False
                
        return True
        
    def process_file(self, input_file: Path, output_file: Path) -> None:
        """Process a single file"""
        logger.info(f"Processing {input_file.name}...")
        
        processed = 0
        kept = 0
        
        with open(input_file, 'r', encoding='utf-8') as f_in, \
             open(output_file, 'w', encoding='utf-8') as f_out:
            
            for line in tqdm(f_in, desc=f"Cleaning {input_file.name}"):
                if not line.strip():
                    continue
                    
                try:
                    doc = json.loads(line)
                    processed += 1
                    
                    if self.should_keep(doc):
                        # Clean the content
                        content = self.clean_text(doc['content'])
                        
                        if content and len(content.split()) >= self.min_words:
                            cleaned_doc = {
                                'source': doc.get('source', ''),
                                'file_path': doc.get('file_path', ''),
                                'content': content,
                                'word_count': len(content.split()),
                                'metadata': doc.get('metadata', {})
                            }
                            
                            f_out.write(json.dumps(cleaned_doc, ensure_ascii=False) + '\n')
                            kept += 1
                            
                except json.JSONDecodeError:
                    continue
                    
        logger.info(f"Finished {input_file.name}: kept {kept}/{processed} documents ({kept/processed*100:.1f}%)")
        
        self.stats['total'] += processed
        self.stats['kept'] += kept
        self.stats['filtered'] += processed - kept
        
    def clean_all(self) -> None:
        """Clean all split files"""
        splits = ['train.jsonl', 'validation.jsonl', 'test.jsonl']
        
        for split in splits:
            input_file = self.input_dir / split
            output_file = self.output_dir / split
            
            if input_file.exists():
                self.process_file(input_file, output_file)
            else:
                logger.warning(f"File {input_file} not found")
                
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("FAST CLEANING SUMMARY")
        logger.info("="*50)
        logger.info(f"Total documents: {self.stats['total']:,}")
        logger.info(f"Kept: {self.stats['kept']:,}")
        logger.info(f"Filtered: {self.stats['filtered']:,}")
        logger.info(f"Retention rate: {self.stats['kept']/self.stats['total']*100:.1f}%")
        
        # Calculate size reduction
        total_clean_size = sum(
            f.stat().st_size for f in self.output_dir.glob('*.jsonl')
        ) / 1024 / 1024
        
        logger.info(f"Clean dataset size: {total_clean_size:.1f} MB")
        
        # Estimate tokens
        estimated_tokens = self.stats['kept'] * 150  # Rough estimate
        logger.info(f"Estimated tokens: {estimated_tokens:,}")
        
    def create_sample(self) -> None:
        """Create sample for inspection"""
        train_file = self.output_dir / 'train.jsonl'
        sample_file = self.output_dir / 'sample.txt'
        
        if not train_file.exists():
            return
            
        with open(train_file, 'r') as f, open(sample_file, 'w') as sample:
            sample.write("CLEANED DATASET SAMPLE\n")
            sample.write("="*50 + "\n\n")
            
            for i, line in enumerate(f):
                if i >= 5:  # First 5 documents
                    break
                    
                doc = json.loads(line)
                sample.write(f"Document {i+1}:\n")
                sample.write(f"Source: {doc['source']}\n")
                sample.write(f"Words: {doc['word_count']}\n")
                sample.write(f"Content:\n{doc['content'][:300]}...\n")
                sample.write("\n" + "-"*30 + "\n\n")


def main():
    cleaner = FastCleaner()
    cleaner.clean_all()
    cleaner.create_sample()
    logger.info("Fast cleaning completed!")


if __name__ == "__main__":
    main()