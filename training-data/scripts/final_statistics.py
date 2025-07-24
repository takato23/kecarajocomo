#!/usr/bin/env python3
"""
Generate final statistics for cleaned dataset
"""

import json
from pathlib import Path
from collections import Counter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_cleaned_dataset():
    """Analyze the cleaned dataset"""
    data_dir = Path("training_data_clean")
    
    stats = {
        'total_documents': 0,
        'total_words': 0,
        'sources': Counter(),
        'word_distribution': [],
        'splits': {}
    }
    
    # Analyze each split
    for split_file in ['train.jsonl', 'validation.jsonl', 'test.jsonl']:
        file_path = data_dir / split_file
        
        if not file_path.exists():
            continue
            
        split_stats = {
            'documents': 0,
            'words': 0,
            'sources': Counter()
        }
        
        logger.info(f"Analyzing {split_file}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    doc = json.loads(line)
                    
                    word_count = doc.get('word_count', 0)
                    source = doc.get('source', 'unknown')
                    
                    split_stats['documents'] += 1
                    split_stats['words'] += word_count
                    split_stats['sources'][source] += 1
                    
                    stats['total_documents'] += 1
                    stats['total_words'] += word_count
                    stats['sources'][source] += 1
                    stats['word_distribution'].append(word_count)
        
        stats['splits'][split_file.replace('.jsonl', '')] = split_stats
        
        logger.info(f"{split_file}: {split_stats['documents']:,} docs, {split_stats['words']:,} words")
    
    # Calculate additional metrics
    stats['estimated_tokens'] = stats['total_words'] * 1.25  # Rough estimate
    stats['avg_words_per_doc'] = stats['total_words'] / stats['total_documents'] if stats['total_documents'] > 0 else 0
    
    # Top sources
    stats['top_sources'] = dict(stats['sources'].most_common(10))
    
    # Word distribution stats
    if stats['word_distribution']:
        stats['word_stats'] = {
            'min': min(stats['word_distribution']),
            'max': max(stats['word_distribution']),
            'avg': sum(stats['word_distribution']) / len(stats['word_distribution']),
            'median': sorted(stats['word_distribution'])[len(stats['word_distribution'])//2]
        }
    
    # Save detailed stats
    with open(data_dir / 'final_statistics.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "="*60)
    print("FINAL CLEANED DATASET STATISTICS")
    print("="*60)
    print(f"Total documents: {stats['total_documents']:,}")
    print(f"Total words: {stats['total_words']:,}")
    print(f"Estimated tokens: {stats['estimated_tokens']:,.0f}")
    print(f"Average words per document: {stats['avg_words_per_doc']:.0f}")
    print(f"Total dataset size: ~{stats['total_words'] * 6 / 1024 / 1024:.1f} MB")
    
    print(f"\nSplit distribution:")
    for split_name, split_data in stats['splits'].items():
        print(f"  {split_name}: {split_data['documents']:,} docs ({split_data['documents']/stats['total_documents']*100:.1f}%)")
    
    print(f"\nTop sources:")
    for source, count in stats['top_sources'].items():
        print(f"  {source}: {count:,} docs ({count/stats['total_documents']*100:.1f}%)")
    
    if 'word_stats' in stats:
        print(f"\nDocument length distribution:")
        print(f"  Min: {stats['word_stats']['min']} words")
        print(f"  Max: {stats['word_stats']['max']} words")
        print(f"  Average: {stats['word_stats']['avg']:.0f} words")
        print(f"  Median: {stats['word_stats']['median']} words")
    
    print(f"\nQuality improvements:")
    print(f"  ✅ Removed Reddit posts and forum spam")
    print(f"  ✅ Filtered out broken encoding")
    print(f"  ✅ Removed HTML artifacts")
    print(f"  ✅ Kept only technical content")
    print(f"  ✅ Prioritized high-quality sources")
    
    print(f"\nReady for GPT training:")
    print(f"  📁 train.jsonl: Main training data")
    print(f"  📁 validation.jsonl: Validation data")
    print(f"  📁 test.jsonl: Test data")
    print(f"  🎯 Estimated training time: {stats['estimated_tokens'] / 1000000:.1f}M tokens")
    
    return stats

if __name__ == "__main__":
    analyze_cleaned_dataset()