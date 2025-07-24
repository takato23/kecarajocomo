#!/usr/bin/env python3
"""
Expanded Data Collection Script for GPT Training
Collects much more data from various sources
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
import time
import hashlib

# Third-party imports
try:
    from bs4 import BeautifulSoup
    import requests
    import pandocfilters
    from tqdm import tqdm
except ImportError:
    print("Error: Required packages not installed.")
    print("Please run: pip install yt-dlp pandocfilters bs4 requests tqdm")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ExpandedDataCollector:
    """Expanded data collector with many more sources"""
    
    def __init__(self, output_dir: str = "training_data_expanded"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Expanded repository list
        self.repos = {
            # Original repos
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
            
            # AI/ML Documentation
            'openai_cookbook': {
                'url': 'https://github.com/openai/openai-cookbook',
                'dir': 'openai-cookbook',
                'patterns': ['*.md', '*.ipynb']
            },
            'langchain': {
                'url': 'https://github.com/langchain-ai/langchain',
                'dir': 'langchain',
                'patterns': ['docs/**/*.md', 'docs/**/*.mdx']
            },
            'huggingface_course': {
                'url': 'https://github.com/huggingface/course',
                'dir': 'hf-course',
                'patterns': ['chapters/**/*.mdx', '*.md']
            },
            
            # Programming & Best Practices
            'clean_code_javascript': {
                'url': 'https://github.com/ryanmcdermott/clean-code-javascript',
                'dir': 'clean-code-js',
                'patterns': ['*.md']
            },
            'system_design_primer': {
                'url': 'https://github.com/donnemartin/system-design-primer',
                'dir': 'system-design',
                'patterns': ['*.md', 'solutions/**/*.md']
            },
            'python_patterns': {
                'url': 'https://github.com/faif/python-patterns',
                'dir': 'python-patterns',
                'patterns': ['*.md', 'patterns/**/*.py']
            },
            'javascript_algorithms': {
                'url': 'https://github.com/trekhleb/javascript-algorithms',
                'dir': 'js-algorithms',
                'patterns': ['README*.md', 'src/**/*.md']
            },
            
            # Documentation & Technical Writing
            'write_the_docs': {
                'url': 'https://github.com/writethedocs/www',
                'dir': 'write-docs',
                'patterns': ['docs/**/*.rst', '*.md']
            },
            'technical_writing_course': {
                'url': 'https://github.com/TechWritingCourse/TechWritingCourse',
                'dir': 'tech-writing',
                'patterns': ['*.md', 'course/**/*.md']
            },
            
            # Security & DevOps
            'awesome_security': {
                'url': 'https://github.com/sbilly/awesome-security',
                'dir': 'awesome-security',
                'patterns': ['*.md']
            },
            'devops_exercises': {
                'url': 'https://github.com/bregman-arie/devops-exercises',
                'dir': 'devops-exercises',
                'patterns': ['*.md', 'exercises/**/*.md']
            },
            
            # Web Development
            'mdn_content': {
                'url': 'https://github.com/mdn/content',
                'dir': 'mdn',
                'patterns': ['files/en-us/**/*.md']
            },
            'css_tricks': {
                'url': 'https://github.com/css-tricks/css-tricks.com',
                'dir': 'css-tricks',
                'patterns': ['*.md', '_posts/*.md']
            },
            
            # Frameworks Documentation
            'react_docs': {
                'url': 'https://github.com/reactjs/react.dev',
                'dir': 'react-docs',
                'patterns': ['src/content/**/*.md']
            },
            'vue_docs': {
                'url': 'https://github.com/vuejs/docs',
                'dir': 'vue-docs',
                'patterns': ['src/**/*.md']
            },
            'nextjs_docs': {
                'url': 'https://github.com/vercel/next.js',
                'dir': 'nextjs',
                'patterns': ['docs/**/*.mdx', 'errors/*.md']
            },
            
            # APIs & Specifications
            'openapi_spec': {
                'url': 'https://github.com/OAI/OpenAPI-Specification',
                'dir': 'openapi',
                'patterns': ['versions/*.md', '*.md']
            },
            'graphql_spec': {
                'url': 'https://github.com/graphql/graphql-spec',
                'dir': 'graphql',
                'patterns': ['spec/*.md', '*.md']
            },
            
            # Cloud & Infrastructure
            'aws_cdk_guide': {
                'url': 'https://github.com/aws/aws-cdk',
                'dir': 'aws-cdk',
                'patterns': ['docs/**/*.md', 'design/*.md']
            },
            'kubernetes_docs': {
                'url': 'https://github.com/kubernetes/website',
                'dir': 'k8s-docs',
                'patterns': ['content/en/**/*.md']
            },
            
            # Testing & Quality
            'jest_docs': {
                'url': 'https://github.com/facebook/jest',
                'dir': 'jest',
                'patterns': ['docs/*.md', 'website/docs/*.md']
            },
            'cypress_docs': {
                'url': 'https://github.com/cypress-io/cypress-documentation',
                'dir': 'cypress',
                'patterns': ['docs/**/*.md']
            }
        }
        
        # Popular YouTube channels for tech content
        self.youtube_channels = {
            'tech_talks': [
                'https://www.youtube.com/watch?v=rI8tNMsozo0',  # React Conf
                'https://www.youtube.com/watch?v=YbNmL6hSNKw',  # Next.js Conf
                'https://www.youtube.com/watch?v=24tQRwIRP_w',  # Vue.js Documentary
            ],
            'tutorials': [
                'https://www.youtube.com/watch?v=RDV3Z1KCBvo',  # JavaScript Course
                'https://www.youtube.com/watch?v=rfscVS0vtbw',  # Python Full Course
                'https://www.youtube.com/watch?v=ZxKM3DCV2kE',  # React Tutorial
            ]
        }
        
        # Additional web resources
        self.web_resources = [
            {
                'name': 'MDN Web Docs',
                'urls': [
                    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
                    'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors',
                    'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'
                ]
            },
            {
                'name': 'W3C Specifications',
                'urls': [
                    'https://www.w3.org/TR/html52/',
                    'https://www.w3.org/TR/CSS2/',
                    'https://www.w3.org/TR/wai-aria-1.1/'
                ]
            }
        ]
        
    def clone_repositories(self, max_workers: int = 4) -> None:
        """Clone all repositories with parallel processing"""
        logger.info(f"Starting repository cloning with {max_workers} workers...")
        
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        def clone_single_repo(name: str, config: Dict[str, Any]) -> tuple:
            repo_dir = Path(config['dir'])
            
            if repo_dir.exists():
                logger.info(f"Repository {name} already exists")
                return (name, 'exists')
                
            logger.info(f"Cloning {name}...")
            cmd = ['git', 'clone', '--depth=1', config['url'], config['dir']]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                return (name, 'success')
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to clone {name}: {e}")
                return (name, 'failed')
        
        # Clone repositories in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(clone_single_repo, name, config): name 
                for name, config in self.repos.items()
            }
            
            results = {'success': 0, 'exists': 0, 'failed': 0}
            
            for future in tqdm(as_completed(futures), total=len(futures), desc="Cloning repos"):
                name, status = future.result()
                results[status] += 1
                
        logger.info(f"Cloning complete: {results['success']} new, {results['exists']} existing, {results['failed']} failed")
        
    def scrape_web_content(self) -> List[Dict[str, Any]]:
        """Scrape content from web resources"""
        logger.info("Scraping web content...")
        scraped_content = []
        
        for resource in self.web_resources:
            logger.info(f"Scraping {resource['name']}...")
            
            for url in resource['urls']:
                try:
                    response = requests.get(url, timeout=30)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Extract main content
                    main_content = soup.find('main') or soup.find('article') or soup.find('body')
                    
                    if main_content:
                        # Remove script and style elements
                        for script in main_content(['script', 'style']):
                            script.decompose()
                            
                        text = main_content.get_text(separator='\n', strip=True)
                        
                        scraped_content.append({
                            'source': resource['name'],
                            'url': url,
                            'content': text,
                            'word_count': len(text.split()),
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        logger.info(f"Scraped {len(text.split())} words from {url}")
                        
                except Exception as e:
                    logger.error(f"Failed to scrape {url}: {e}")
                    
                # Rate limiting
                time.sleep(1)
                
        return scraped_content
        
    def extract_code_documentation(self) -> List[Dict[str, Any]]:
        """Extract inline documentation from code files"""
        logger.info("Extracting code documentation...")
        code_docs = []
        
        # Process Python files for docstrings
        for name, config in self.repos.items():
            repo_dir = Path(config['dir'])
            if not repo_dir.exists():
                continue
                
            # Find Python files
            py_files = list(repo_dir.rglob('*.py'))[:100]  # Limit to prevent huge processing
            
            for py_file in py_files:
                try:
                    with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    # Extract docstrings
                    docstrings = re.findall(r'"""(.*?)"""', content, re.DOTALL)
                    docstrings.extend(re.findall(r"'''(.*?)'''", content, re.DOTALL))
                    
                    if docstrings:
                        combined = '\n\n'.join(docstrings)
                        code_docs.append({
                            'source': f"{name}_code_docs",
                            'file_path': str(py_file),
                            'content': combined,
                            'word_count': len(combined.split()),
                            'type': 'python_docstrings'
                        })
                        
                except Exception as e:
                    logger.debug(f"Error processing {py_file}: {e}")
                    
        logger.info(f"Extracted documentation from {len(code_docs)} code files")
        return code_docs
        
    def process_jupyter_notebooks(self) -> List[Dict[str, Any]]:
        """Process Jupyter notebooks for markdown and code cells"""
        logger.info("Processing Jupyter notebooks...")
        notebook_content = []
        
        for name, config in self.repos.items():
            repo_dir = Path(config['dir'])
            if not repo_dir.exists():
                continue
                
            nb_files = list(repo_dir.rglob('*.ipynb'))
            
            for nb_file in nb_files:
                try:
                    with open(nb_file, 'r', encoding='utf-8') as f:
                        notebook = json.load(f)
                        
                    content_parts = []
                    
                    # Extract markdown and code cells
                    for cell in notebook.get('cells', []):
                        if cell['cell_type'] == 'markdown':
                            content_parts.append(''.join(cell['source']))
                        elif cell['cell_type'] == 'code':
                            # Include code comments and docstrings
                            code = ''.join(cell['source'])
                            comments = re.findall(r'#.*$', code, re.MULTILINE)
                            if comments:
                                content_parts.append('\n'.join(comments))
                                
                    if content_parts:
                        combined = '\n\n'.join(content_parts)
                        notebook_content.append({
                            'source': f"{name}_notebooks",
                            'file_path': str(nb_file),
                            'content': combined,
                            'word_count': len(combined.split()),
                            'type': 'jupyter_notebook'
                        })
                        
                except Exception as e:
                    logger.debug(f"Error processing {nb_file}: {e}")
                    
        logger.info(f"Processed {len(notebook_content)} Jupyter notebooks")
        return notebook_content
        
    def create_corpus_chunks(self, all_content: Dict[str, List[Dict[str, Any]]], 
                           chunk_size_mb: int = 50) -> None:
        """Create chunked files for large corpus"""
        logger.info(f"Creating corpus chunks of {chunk_size_mb}MB each...")
        
        chunk_size_bytes = chunk_size_mb * 1024 * 1024
        current_chunk = []
        current_size = 0
        chunk_number = 1
        
        # Flatten all content
        all_documents = []
        for source, docs in all_content.items():
            for doc in docs:
                doc['source_category'] = source
                all_documents.append(doc)
                
        # Sort by size for better chunking
        all_documents.sort(key=lambda x: x['word_count'], reverse=True)
        
        for doc in tqdm(all_documents, desc="Creating chunks"):
            doc_json = json.dumps(doc, ensure_ascii=False)
            doc_size = len(doc_json.encode('utf-8'))
            
            if current_size + doc_size > chunk_size_bytes and current_chunk:
                # Save current chunk
                chunk_file = self.output_dir / f'corpus_chunk_{chunk_number:03d}.jsonl'
                with open(chunk_file, 'w', encoding='utf-8') as f:
                    for chunk_doc in current_chunk:
                        f.write(json.dumps(chunk_doc, ensure_ascii=False) + '\n')
                        
                logger.info(f"Saved chunk {chunk_number} with {len(current_chunk)} documents ({current_size / 1024 / 1024:.1f}MB)")
                
                # Start new chunk
                current_chunk = [doc]
                current_size = doc_size
                chunk_number += 1
            else:
                current_chunk.append(doc)
                current_size += doc_size
                
        # Save final chunk
        if current_chunk:
            chunk_file = self.output_dir / f'corpus_chunk_{chunk_number:03d}.jsonl'
            with open(chunk_file, 'w', encoding='utf-8') as f:
                for chunk_doc in current_chunk:
                    f.write(json.dumps(chunk_doc, ensure_ascii=False) + '\n')
                    
            logger.info(f"Saved final chunk {chunk_number} with {len(current_chunk)} documents")
            
    def create_training_splits(self, all_content: Dict[str, List[Dict[str, Any]]]) -> None:
        """Create train/validation/test splits"""
        logger.info("Creating training splits...")
        
        # Flatten and shuffle
        import random
        all_docs = []
        for source, docs in all_content.items():
            all_docs.extend(docs)
            
        random.shuffle(all_docs)
        
        # Split ratios
        total = len(all_docs)
        train_size = int(0.8 * total)
        val_size = int(0.1 * total)
        
        train_docs = all_docs[:train_size]
        val_docs = all_docs[train_size:train_size + val_size]
        test_docs = all_docs[train_size + val_size:]
        
        # Save splits
        splits = {
            'train': train_docs,
            'validation': val_docs,
            'test': test_docs
        }
        
        for split_name, docs in splits.items():
            split_file = self.output_dir / f'{split_name}.jsonl'
            with open(split_file, 'w', encoding='utf-8') as f:
                for doc in docs:
                    f.write(json.dumps(doc, ensure_ascii=False) + '\n')
                    
            logger.info(f"Saved {split_name} split with {len(docs)} documents")
            
    def generate_enhanced_statistics(self, all_content: Dict[str, List[Dict[str, Any]]]) -> None:
        """Generate detailed statistics with visualizations"""
        import matplotlib.pyplot as plt
        
        stats = {
            'total_documents': 0,
            'total_words': 0,
            'total_characters': 0,
            'estimated_tokens': 0,
            'sources': {},
            'file_types': {},
            'size_distribution': []
        }
        
        for source, documents in all_content.items():
            doc_count = len(documents)
            word_count = sum(doc['word_count'] for doc in documents)
            char_count = sum(len(doc['content']) for doc in documents)
            
            stats['total_documents'] += doc_count
            stats['total_words'] += word_count
            stats['total_characters'] += char_count
            stats['estimated_tokens'] += word_count * 1.25  # Rough estimate
            
            stats['sources'][source] = {
                'document_count': doc_count,
                'word_count': word_count,
                'avg_doc_size': word_count / doc_count if doc_count > 0 else 0
            }
            
            # Track file types
            for doc in documents:
                file_ext = Path(doc.get('file_path', '')).suffix or 'web'
                stats['file_types'][file_ext] = stats['file_types'].get(file_ext, 0) + 1
                stats['size_distribution'].append(doc['word_count'])
                
        # Save detailed stats
        stats_file = self.output_dir / 'detailed_statistics.json'
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
            
        # Create visualization
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        
        # Source distribution
        sources = list(stats['sources'].keys())
        doc_counts = [stats['sources'][s]['document_count'] for s in sources]
        axes[0, 0].bar(range(len(sources)), doc_counts)
        axes[0, 0].set_xticks(range(len(sources)))
        axes[0, 0].set_xticklabels(sources, rotation=45, ha='right')
        axes[0, 0].set_title('Documents by Source')
        axes[0, 0].set_ylabel('Document Count')
        
        # Word count distribution
        axes[0, 1].hist(stats['size_distribution'], bins=50, edgecolor='black')
        axes[0, 1].set_title('Document Size Distribution')
        axes[0, 1].set_xlabel('Words per Document')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].set_yscale('log')
        
        # File type distribution
        file_types = list(stats['file_types'].keys())[:10]  # Top 10
        file_counts = [stats['file_types'][ft] for ft in file_types]
        axes[1, 0].pie(file_counts, labels=file_types, autopct='%1.1f%%')
        axes[1, 0].set_title('File Type Distribution')
        
        # Summary stats text
        summary_text = f"""Total Statistics:
        
Documents: {stats['total_documents']:,}
Words: {stats['total_words']:,}
Characters: {stats['total_characters']:,}
Est. Tokens: {stats['estimated_tokens']:,.0f}
Est. Size: {stats['total_characters'] / 1024 / 1024:.1f} MB

Avg Doc Size: {stats['total_words'] / stats['total_documents']:.0f} words
Total Sources: {len(stats['sources'])}
File Types: {len(stats['file_types'])}
        """
        
        axes[1, 1].text(0.1, 0.5, summary_text, transform=axes[1, 1].transAxes,
                       fontsize=12, verticalalignment='center', fontfamily='monospace')
        axes[1, 1].axis('off')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'corpus_statistics.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        logger.info(f"\nCorpus Statistics:")
        logger.info(f"Total documents: {stats['total_documents']:,}")
        logger.info(f"Total words: {stats['total_words']:,}")
        logger.info(f"Estimated tokens: {stats['estimated_tokens']:,.0f}")
        logger.info(f"Estimated size: {stats['total_characters'] / 1024 / 1024:.1f} MB")
        
    def run_expanded_collection(self) -> None:
        """Run the expanded collection pipeline"""
        logger.info("Starting expanded data collection...")
        
        # 1. Clone repositories in parallel
        self.clone_repositories(max_workers=4)
        
        # 2. Process all markdown files
        all_content = self.process_markdown_files()
        
        # 3. Extract code documentation
        code_docs = self.extract_code_documentation()
        all_content['code_documentation'] = code_docs
        
        # 4. Process Jupyter notebooks
        notebook_content = self.process_jupyter_notebooks()
        all_content['jupyter_notebooks'] = notebook_content
        
        # 5. Scrape web content
        web_content = self.scrape_web_content()
        all_content['web_scraped'] = web_content
        
        # 6. Extract YouTube subtitles
        all_youtube_urls = []
        for category, urls in self.youtube_channels.items():
            all_youtube_urls.extend(urls)
        if all_youtube_urls:
            self.extract_youtube_subtitles(all_youtube_urls)
            
        # 7. Create corpus chunks for large files
        self.create_corpus_chunks(all_content)
        
        # 8. Create training splits
        self.create_training_splits(all_content)
        
        # 9. Generate enhanced statistics
        self.generate_enhanced_statistics(all_content)
        
        # 10. Save main corpus file
        self.save_processed_data(all_content)
        
        logger.info("Expanded data collection completed!")


# Inherit original methods we want to keep
from assemble import DataCollector
class ExpandedDataCollector(ExpandedDataCollector, DataCollector):
    """Combined collector with all methods"""
    pass


def main():
    """Main entry point for expanded collection"""
    collector = ExpandedDataCollector()
    collector.run_expanded_collection()


if __name__ == "__main__":
    main()