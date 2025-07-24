#!/bin/bash

# Mega Collection Script - Collect maximum training data
# This script collects data from many more sources

set -e

echo "=== MEGA GPT Training Data Collection ==="
echo "This will collect MUCH more data (potentially 100MB+ / millions of tokens)"
echo

# Install additional dependencies
echo "Installing additional dependencies..."
pip install tqdm matplotlib || echo "Warning: Some packages failed to install"

# Create directories
mkdir -p training_data_expanded
mkdir -p additional_sources

# Function to clone large documentation repositories
clone_large_repo() {
    local url=$1
    local dir=$2
    local name=$3
    
    echo "Cloning $name (this may take a while)..."
    if [ -d "$dir" ]; then
        echo "$name already exists, updating..."
        cd "$dir"
        git pull || echo "Could not update"
        cd ..
    else
        # Clone with more history for better content
        git clone --depth=100 "$url" "$dir" || echo "Failed to clone $name"
    fi
}

echo
echo "=== Collecting Additional Large Sources ==="

# Programming Language Documentation
clone_large_repo "https://github.com/python/cpython" "additional_sources/python-docs" "Python Documentation"
clone_large_repo "https://github.com/nodejs/node" "additional_sources/nodejs-docs" "Node.js Documentation"
clone_large_repo "https://github.com/golang/go" "additional_sources/golang-docs" "Go Documentation"

# More Framework Documentation
clone_large_repo "https://github.com/angular/angular" "additional_sources/angular" "Angular Framework"
clone_large_repo "https://github.com/sveltejs/svelte" "additional_sources/svelte" "Svelte Framework"
clone_large_repo "https://github.com/django/django" "additional_sources/django" "Django Framework"
clone_large_repo "https://github.com/rails/rails" "additional_sources/rails" "Ruby on Rails"

# DevOps & Cloud
clone_large_repo "https://github.com/terraform-providers/terraform-provider-aws" "additional_sources/terraform-aws" "Terraform AWS"
clone_large_repo "https://github.com/ansible/ansible" "additional_sources/ansible" "Ansible"
clone_large_repo "https://github.com/docker/docker.github.io" "additional_sources/docker-docs" "Docker Documentation"

# Data Science & ML
clone_large_repo "https://github.com/scikit-learn/scikit-learn" "additional_sources/sklearn" "Scikit-learn"
clone_large_repo "https://github.com/pytorch/pytorch" "additional_sources/pytorch" "PyTorch"
clone_large_repo "https://github.com/tensorflow/tensorflow" "additional_sources/tensorflow" "TensorFlow"

# Awesome Lists (curated resources)
clone_large_repo "https://github.com/sindresorhus/awesome" "additional_sources/awesome" "Awesome Lists"
clone_large_repo "https://github.com/vinta/awesome-python" "additional_sources/awesome-python" "Awesome Python"
clone_large_repo "https://github.com/sorrycc/awesome-javascript" "additional_sources/awesome-javascript" "Awesome JavaScript"

# Books & Tutorials
clone_large_repo "https://github.com/getify/You-Dont-Know-JS" "additional_sources/ydkjs" "You Don't Know JS"
clone_large_repo "https://github.com/ossu/computer-science" "additional_sources/cs-curriculum" "Open Source CS Curriculum"

echo
echo "=== Downloading Additional Content ==="

# Download free programming books
echo "Downloading free programming books list..."
wget -q -O additional_sources/free-programming-books.md \
    https://raw.githubusercontent.com/EbookFoundation/free-programming-books/main/books/free-programming-books.md || \
    echo "Failed to download free books list"

# Download more YouTube transcripts (tech talks, tutorials)
echo "Downloading popular tech talk transcripts..."
TECH_VIDEOS=(
    # Google I/O talks
    "https://www.youtube.com/watch?v=nP-nMZpLM1A"  # Web keynote
    "https://www.youtube.com/watch?v=7V-fIGMDsmE"  # Android keynote
    
    # Popular tutorials
    "https://www.youtube.com/watch?v=PkZNo7MFNFg"  # JavaScript tutorial
    "https://www.youtube.com/watch?v=_uQrJ0TkZlc"  # Python tutorial
    "https://www.youtube.com/watch?v=0pThnRneDjw"  # React Redux
    
    # System design
    "https://www.youtube.com/watch?v=xpDnVSmNFX0"  # System design interview
    
    # Add more video IDs as needed
)

for video in "${TECH_VIDEOS[@]}"; do
    echo "Attempting to download transcript from: $video"
    yt-dlp --skip-download --write-auto-sub --sub-format vtt \
        -o 'training_data_expanded/%(title)s.%(ext)s' "$video" 2>/dev/null || \
        echo "Could not download from $video"
done

echo
echo "=== Running Expanded Collection Script ==="

# Run the expanded Python collector
python3 expand_collection.py || {
    echo "Error running expanded collection"
    echo "Falling back to original collector..."
    python3 assemble.py
}

echo
echo "=== Creating Combined Dataset ==="

# Combine all data sources
echo "Combining all collected data..."
python3 - << 'EOF'
import json
import os
from pathlib import Path

# Combine data from both collectors
all_data = {}
stats = {'total_docs': 0, 'total_words': 0, 'total_mb': 0}

# Read original data
if Path('training_data/training_data.json').exists():
    with open('training_data/training_data.json', 'r') as f:
        original = json.load(f)
        for k, v in original.items():
            all_data[f'original_{k}'] = v
            stats['total_docs'] += len(v)

# Read expanded data
for jsonl_file in Path('training_data_expanded').glob('*.jsonl'):
    docs = []
    with open(jsonl_file, 'r') as f:
        for line in f:
            if line.strip():
                docs.append(json.loads(line))
    if docs:
        all_data[jsonl_file.stem] = docs
        stats['total_docs'] += len(docs)

# Calculate statistics
for source, docs in all_data.items():
    for doc in docs:
        if isinstance(doc, dict) and 'word_count' in doc:
            stats['total_words'] += doc['word_count']

# Estimate size
stats['total_mb'] = sum(len(json.dumps(docs)) for docs in all_data.values()) / 1024 / 1024
stats['estimated_tokens'] = stats['total_words'] * 1.25

print(f"\n=== FINAL STATISTICS ===")
print(f"Total documents collected: {stats['total_docs']:,}")
print(f"Total words: {stats['total_words']:,}")
print(f"Total size: {stats['total_mb']:.1f} MB")
print(f"Estimated tokens: {stats['estimated_tokens']:,.0f}")
print(f"Number of sources: {len(all_data)}")

# Save combined statistics
with open('training_data_expanded/final_statistics.json', 'w') as f:
    json.dump(stats, f, indent=2)
EOF

echo
echo "=== Collection Complete ==="
echo
echo "Data saved in:"
echo "- training_data/ (original collection)"
echo "- training_data_expanded/ (expanded collection)"
echo "- additional_sources/ (cloned repositories)"
echo
echo "To use for training:"
echo "1. Check training_data_expanded/ for chunked files (corpus_chunk_*.jsonl)"
echo "2. Use train.jsonl, validation.jsonl, test.jsonl for split datasets"
echo "3. See detailed_statistics.json and corpus_statistics.png for analysis"
echo
echo "Tips for GPT training:"
echo "- Each corpus_chunk file is ~50MB for easy handling"
echo "- Use JSONL format for streaming large datasets"
echo "- The data includes diverse sources: documentation, code, tutorials, books"
echo "- Total estimated tokens should be in millions (good for fine-tuning)"