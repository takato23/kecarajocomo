#!/usr/bin/env python3
"""
Dataset Cleaning and Quality Filtering Script
Removes low-quality content and fixes encoding issues
"""

import json
import re
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from collections import Counter
import unicodedata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatasetCleaner:
    """Clean and filter training dataset for quality"""
    
    def __init__(self, input_dir: str = "training_data_expanded", output_dir: str = "training_data_clean"):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Quality thresholds
        self.min_word_count = 50          # Minimum words per document
        self.max_word_count = 50000       # Maximum words per document
        self.min_avg_word_length = 3      # Minimum average word length
        self.max_avg_word_length = 20     # Maximum average word length
        self.min_sentence_length = 10     # Minimum words per sentence
        self.max_broken_chars_ratio = 0.1 # Maximum ratio of broken characters
        
        # Patterns to detect low-quality content
        self.spam_patterns = [
            r'reddit\.com',
            r'upvote',
            r'downvote',
            r'karma',
            r'[0-9]+\s+points?',
            r'permalink',
            r'save\s+comment',
            r'give\s+award',
            r'share\s+report',
            r'continue\s+this\s+thread',
            r'view\s+discussions\s+in',
            r'more\s+replies',
            r'load\s+more\s+comments',
            r'sort\s+by:',
            r'new\s+comments',
            r'best\s+comments',
            r'top\s+comments',
            r'controversial',
            r'gilded',
            r'archived',
            r'locked',
            r'stickied',
            r'removed\s+by\s+moderator',
            r'deleted\s+by\s+user',
            r'account\s+suspended',
            r'shadowbanned',
            r'[0-9]+\s+comment\s+deleted',
            r'this\s+comment\s+has\s+been\s+deleted',
            r'comment\s+removed\s+by\s+moderator',
            r'user\s+deleted\s+their\s+account'
        ]
        
        # Bad file patterns to skip entirely
        self.bad_file_patterns = [
            r'reddit',
            r'comment',
            r'discussion',
            r'forum',
            r'thread',
            r'post',
            r'blog/_posts',
            r'issues',
            r'pull',
            r'changelog',
            r'release',
            r'news',
            r'announce'
        ]
        
        # High-quality sources to prioritize
        self.high_quality_sources = {
            'mdn_content',
            'owasp', 
            'openai_cookbook',
            'langchain',
            'huggingface_course',
            'react_docs',
            'vue_docs',
            'nextjs_docs',
            'kubernetes_docs',
            'system_design_primer',
            'clean_code_javascript',
            'javascript_algorithms',
            'python_patterns'
        }
        
        # Stats tracking
        self.stats = {
            'total_input': 0,
            'filtered_out': 0,
            'quality_kept': 0,
            'reasons': Counter()
        }
        
    def is_broken_encoding(self, text: str) -> bool:
        """Check if text has broken encoding"""
        if not text:
            return True
            
        # Count broken characters
        broken_chars = 0
        total_chars = len(text)
        
        if total_chars == 0:
            return True
            
        for char in text:
            # Check for common broken encoding patterns
            if ord(char) > 65535:  # Beyond Basic Multilingual Plane
                broken_chars += 1
            elif char in '����':  # Replacement characters
                broken_chars += 1
            elif ord(char) < 32 and char not in '\n\r\t':  # Control characters
                broken_chars += 1
                
        broken_ratio = broken_chars / total_chars
        return broken_ratio > self.max_broken_chars_ratio
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
            
        # Normalize unicode
        text = unicodedata.normalize('NFKC', text)
        
        # Remove broken encoding artifacts
        text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        # Remove common artifacts
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove HTML tags but preserve structure
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove URLs but keep domain for context
        text = re.sub(r'https?://[^\s]+', '[URL]', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+\.\S+', '[EMAIL]', text)
        
        # Remove excessive punctuation
        text = re.sub(r'[.]{3,}', '...', text)
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        
        return text.strip()
        
    def contains_spam(self, text: str) -> bool:
        """Check if text contains spam patterns"""
        text_lower = text.lower()
        
        for pattern in self.spam_patterns:
            if re.search(pattern, text_lower):
                return True
                
        return False
        
    def is_bad_file(self, file_path: str) -> bool:
        """Check if file path indicates low-quality content"""
        file_path_lower = file_path.lower()
        
        for pattern in self.bad_file_patterns:
            if re.search(pattern, file_path_lower):
                return True
                
        return False
        
    def calculate_quality_score(self, doc: Dict[str, Any]) -> tuple[float, str]:
        """Calculate quality score for document"""
        content = doc.get('content', '')
        
        if not content:
            return 0.0, "empty_content"
            
        # Clean content first
        clean_content = self.clean_text(content)
        
        if not clean_content:
            return 0.0, "empty_after_cleaning"
            
        # Check encoding
        if self.is_broken_encoding(clean_content):
            return 0.0, "broken_encoding"
            
        # Check for spam
        if self.contains_spam(clean_content):
            return 0.0, "spam_content"
            
        # Check file path
        file_path = doc.get('file_path', '')
        if self.is_bad_file(file_path):
            return 0.0, "bad_file_path"
            
        # Basic metrics
        words = clean_content.split()
        word_count = len(words)
        
        # Word count filter
        if word_count < self.min_word_count:
            return 0.0, "too_short"
        if word_count > self.max_word_count:
            return 0.0, "too_long"
            
        # Average word length
        if words:
            avg_word_length = sum(len(word) for word in words) / len(words)
            if avg_word_length < self.min_avg_word_length:
                return 0.0, "words_too_short"
            if avg_word_length > self.max_avg_word_length:
                return 0.0, "words_too_long"
        
        # Sentence structure
        sentences = re.split(r'[.!?]+', clean_content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if sentences:
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            if avg_sentence_length < self.min_sentence_length:
                return 0.0, "sentences_too_short"
        
        # Calculate quality score
        score = 0.0
        
        # Source quality bonus
        source = doc.get('source', '')
        if source in self.high_quality_sources:
            score += 0.3
        
        # Content length bonus (sweet spot)
        if 200 <= word_count <= 5000:
            score += 0.2
        elif 100 <= word_count <= 10000:
            score += 0.1
            
        # Technical content indicators
        tech_indicators = [
            r'function\s+\w+',
            r'class\s+\w+',
            r'import\s+\w+',
            r'const\s+\w+',
            r'let\s+\w+',
            r'var\s+\w+',
            r'def\s+\w+',
            r'public\s+class',
            r'private\s+\w+',
            r'algorithm',
            r'implementation',
            r'documentation',
            r'example',
            r'tutorial',
            r'guide',
            r'reference',
            r'API',
            r'method',
            r'parameter',
            r'return',
            r'exception',
            r'error',
            r'debugging',
            r'testing',
            r'deployment',
            r'configuration',
            r'performance',
            r'security',
            r'authentication',
            r'authorization',
            r'database',
            r'query',
            r'server',
            r'client',
            r'framework',
            r'library',
            r'package',
            r'module',
            r'component',
            r'service',
            r'middleware',
            r'router',
            r'controller',
            r'model',
            r'view',
            r'template',
            r'schema',
            r'validation',
            r'serialization',
            r'parsing',
            r'optimization',
            r'caching',
            r'logging',
            r'monitoring',
            r'metrics',
            r'pipeline',
            r'workflow',
            r'deployment',
            r'containerization',
            r'orchestration',
            r'microservices',
            r'architecture',
            r'design pattern',
            r'best practice',
            r'code review',
            r'version control',
            r'git',
            r'repository',
            r'branch',
            r'merge',
            r'commit',
            r'pull request'
        ]
        
        tech_count = sum(1 for pattern in tech_indicators if re.search(pattern, clean_content, re.IGNORECASE))
        score += min(tech_count * 0.02, 0.3)  # Cap at 0.3
        
        # Documentation structure bonus
        if re.search(r'#+\s+\w+', clean_content):  # Markdown headers
            score += 0.1
        if re.search(r'```\w*\n.*?\n```', clean_content, re.DOTALL):  # Code blocks
            score += 0.2
        if re.search(r'^\s*[\-\*\+]\s+', clean_content, re.MULTILINE):  # Lists
            score += 0.05
            
        # Ensure minimum score for high-quality sources
        if source in self.high_quality_sources and score < 0.5:
            score = 0.5
            
        return score, "quality_passed"
        
    def process_document(self, doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process single document"""
        self.stats['total_input'] += 1
        
        # Calculate quality score
        score, reason = self.calculate_quality_score(doc)
        
        if score < 0.5:  # Quality threshold
            self.stats['filtered_out'] += 1
            self.stats['reasons'][reason] += 1
            return None
            
        # Clean the content
        content = doc.get('content', '')
        clean_content = self.clean_text(content)
        
        if not clean_content:
            self.stats['filtered_out'] += 1
            self.stats['reasons']['empty_after_cleaning'] += 1
            return None
            
        # Update document
        cleaned_doc = {
            'source': doc.get('source', ''),
            'file_path': doc.get('file_path', ''),
            'content': clean_content,
            'word_count': len(clean_content.split()),
            'quality_score': score,
            'timestamp': doc.get('timestamp', ''),
            'metadata': doc.get('metadata', {})
        }
        
        self.stats['quality_kept'] += 1
        return cleaned_doc
        
    def clean_dataset(self) -> None:
        """Clean entire dataset"""
        logger.info("Starting dataset cleaning...")
        
        # Process train, validation, test splits
        splits = ['train.jsonl', 'validation.jsonl', 'test.jsonl']
        
        for split_file in splits:
            input_file = self.input_dir / split_file
            output_file = self.output_dir / split_file
            
            if not input_file.exists():
                logger.warning(f"File {input_file} not found, skipping...")
                continue
                
            logger.info(f"Processing {split_file}...")
            
            with open(input_file, 'r', encoding='utf-8') as f_in, \
                 open(output_file, 'w', encoding='utf-8') as f_out:
                
                processed = 0
                kept = 0
                
                for line in f_in:
                    if line.strip():
                        try:
                            doc = json.loads(line)
                            cleaned_doc = self.process_document(doc)
                            
                            if cleaned_doc:
                                f_out.write(json.dumps(cleaned_doc, ensure_ascii=False) + '\n')
                                kept += 1
                                
                            processed += 1
                            
                            if processed % 1000 == 0:
                                logger.info(f"Processed {processed} documents, kept {kept}")
                                
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON in {split_file}")
                            continue
                            
                logger.info(f"Finished {split_file}: {kept}/{processed} documents kept")
                
    def create_quality_report(self) -> None:
        """Create quality report"""
        report = {
            'cleaning_summary': {
                'total_input_documents': self.stats['total_input'],
                'documents_kept': self.stats['quality_kept'],
                'documents_filtered': self.stats['filtered_out'],
                'retention_rate': self.stats['quality_kept'] / self.stats['total_input'] if self.stats['total_input'] > 0 else 0
            },
            'filtering_reasons': dict(self.stats['reasons']),
            'quality_thresholds': {
                'min_word_count': self.min_word_count,
                'max_word_count': self.max_word_count,
                'min_avg_word_length': self.min_avg_word_length,
                'max_avg_word_length': self.max_avg_word_length,
                'min_sentence_length': self.min_sentence_length,
                'max_broken_chars_ratio': self.max_broken_chars_ratio
            }
        }
        
        # Save report
        with open(self.output_dir / 'quality_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("DATASET CLEANING SUMMARY")
        logger.info("="*50)
        logger.info(f"Total input documents: {self.stats['total_input']:,}")
        logger.info(f"Documents kept: {self.stats['quality_kept']:,}")
        logger.info(f"Documents filtered: {self.stats['filtered_out']:,}")
        logger.info(f"Retention rate: {report['cleaning_summary']['retention_rate']:.1%}")
        logger.info("\nTop filtering reasons:")
        for reason, count in self.stats['reasons'].most_common(10):
            logger.info(f"  {reason}: {count:,}")
            
    def create_sample_file(self) -> None:
        """Create sample file for manual inspection"""
        logger.info("Creating sample file for inspection...")
        
        train_file = self.output_dir / 'train.jsonl'
        sample_file = self.output_dir / 'sample_inspection.txt'
        
        if not train_file.exists():
            return
            
        with open(train_file, 'r', encoding='utf-8') as f, \
             open(sample_file, 'w', encoding='utf-8') as sample:
            
            sample.write("CLEANED DATASET SAMPLE\n")
            sample.write("="*50 + "\n\n")
            
            for i, line in enumerate(f):
                if i >= 10:  # First 10 documents
                    break
                    
                doc = json.loads(line)
                sample.write(f"Document {i+1}:\n")
                sample.write(f"Source: {doc['source']}\n")
                sample.write(f"File: {doc['file_path']}\n")
                sample.write(f"Word count: {doc['word_count']}\n")
                sample.write(f"Quality score: {doc['quality_score']:.2f}\n")
                sample.write(f"Content preview:\n{doc['content'][:500]}...\n")
                sample.write("\n" + "-"*50 + "\n\n")
                
    def run(self) -> None:
        """Run complete cleaning process"""
        self.clean_dataset()
        self.create_quality_report()
        self.create_sample_file()
        logger.info("Dataset cleaning completed!")


def main():
    """Main entry point"""
    cleaner = DatasetCleaner()
    cleaner.run()


if __name__ == "__main__":
    main()