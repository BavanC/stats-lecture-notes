#!/usr/bin/env python3
"""
Script to extract all text content from HTML files in the stats lecture notes
and combine them into a single text file for LLM processing.
"""

import os
import re
from bs4 import BeautifulSoup
from pathlib import Path

def clean_text(text):
    """Clean and normalize text content."""
    # Remove extra whitespace and normalize line breaks
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def extract_text_from_html(file_path):
    """Extract text content from an HTML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean the text
        text = clean_text(text)
        
        return text
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return ""

def main():
    # Get the current directory
    base_dir = Path.cwd()
    
    # Find all HTML files, excluding assets directory
    html_files = []
    for file_path in base_dir.rglob("*.html"):
        if "assets" not in str(file_path):
            html_files.append(file_path)
    
    # Sort files for consistent output
    html_files.sort()
    
    print(f"Found {len(html_files)} HTML files to process:")
    for file_path in html_files:
        print(f"  - {file_path}")
    
    # Extract content from each file
    all_content = []
    
    for file_path in html_files:
        print(f"Processing: {file_path.name}")
        
        # Get relative path for the header
        relative_path = file_path.relative_to(base_dir)
        
        # Extract text content
        content = extract_text_from_html(file_path)
        
        if content:
            # Add file header
            file_header = f"\n{'='*80}\n"
            file_header += f"FILE: {relative_path}\n"
            file_header += f"{'='*80}\n\n"
            
            all_content.append(file_header + content)
    
    # Combine all content
    combined_content = "\n\n".join(all_content)
    
    # Write to output file
    output_file = base_dir / "all_content_for_llm.txt"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("STATS LECTURE NOTES - ALL CONTENT\n")
        f.write("=" * 50 + "\n\n")
        f.write("This file contains all text content from the stats lecture notes HTML files.\n")
        f.write("Use this content to identify additional terms that should be added to the glossary.\n\n")
        f.write(combined_content)
    
    print(f"\nExtraction complete!")
    print(f"Output file: {output_file}")
    print(f"Total content length: {len(combined_content)} characters")
    print(f"Files processed: {len(html_files)}")

if __name__ == "__main__":
    main() 