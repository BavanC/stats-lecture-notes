#!/usr/bin/env python3
"""
Script to apply question changes from a downloaded changes file.
Creates timestamped backups in .testing/validation/ before applying changes.
"""

import json
import os
import sys
import shutil
from datetime import datetime
from pathlib import Path

def create_validation_backups(changes_file, target_files):
    """Create timestamped backups of all files in .testing/validation/"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    validation_dir = Path(".testing/validation")
    validation_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy the changes file
    changes_backup = validation_dir / f"changes_{timestamp}.json"
    shutil.copy2(changes_file, changes_backup)
    print(f"✓ Backed up changes file to: {changes_backup}")
    
    # Copy each target file
    for target_file in target_files:
        if os.path.exists(target_file):
            target_backup = validation_dir / f"{Path(target_file).stem}_{timestamp}.json"
            shutil.copy2(target_file, target_backup)
            print(f"✓ Backed up {target_file} to: {target_backup}")
        else:
            print(f"⚠ Warning: Target file {target_file} does not exist")
    
    return timestamp

def load_json_file(filepath):
    """Load and parse a JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}")
        return None
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        return None

def save_json_file(filepath, data):
    """Save data to a JSON file with proper formatting."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False

def apply_changes(changes_data, dry_run=True):
    """Apply changes to the question files."""
    if not changes_data:
        print("Error: No changes data loaded")
        return False
    
    changes = changes_data.get('changes', [])
    deletes = changes_data.get('deletes', [])
    
    if not changes and not deletes:
        print("No changes or deletes found in the file")
        return True
    
    # Track which files will be modified
    files_to_modify = set()
    
    # Collect all files that need modification
    for change in changes:
        files_to_modify.add(change['file'])
    
    for delete in deletes:
        files_to_modify.add(delete['file'])
    
    print(f"\nFiles that will be modified: {', '.join(sorted(files_to_modify))}")
    
    # Load all target files
    file_data = {}
    for filepath in files_to_modify:
        data = load_json_file(filepath)
        if data is None:
            print(f"Error: Could not load {filepath}")
            return False
        file_data[filepath] = data
    
    # Apply changes
    for change in changes:
        filepath = change['file']
        question_id = change['question_id']
        field = change['field']
        new_value = change['new_value']
        
        # Find the question in the file
        questions = file_data[filepath]
        question_found = False
        
        for question in questions:
            if question.get('id') == question_id:
                if dry_run:
                    old_value = question.get(field, "N/A")
                    print(f"DRY RUN: Would change {filepath} - Question {question_id} - {field}: '{old_value}' → '{new_value}'")
                else:
                    question[field] = new_value
                    print(f"✓ Applied change: {filepath} - Question {question_id} - {field}: '{new_value}'")
                question_found = True
                break
        
        if not question_found:
            print(f"Warning: Question {question_id} not found in {filepath}")
    
    # Apply deletes
    for delete in deletes:
        filepath = delete['file']
        question_id = delete['question_id']
        
        questions = file_data[filepath]
        question_found = False
        
        for i, question in enumerate(questions):
            if question.get('id') == question_id:
                if dry_run:
                    print(f"DRY RUN: Would delete question {question_id} from {filepath}")
                else:
                    deleted_question = questions.pop(i)
                    print(f"✓ Deleted question {question_id} from {filepath}")
                question_found = True
                break
        
        if not question_found:
            print(f"Warning: Question {question_id} not found in {filepath} for deletion")
    
    # Save files if not dry run
    if not dry_run:
        for filepath, data in file_data.items():
            if save_json_file(filepath, data):
                print(f"✓ Saved {filepath}")
            else:
                print(f"Error: Failed to save {filepath}")
                return False
    
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python apply-question-changes.py <changes_file> [--apply]")
        print("  --apply: Actually apply the changes (default is dry-run)")
        sys.exit(1)
    
    changes_file = sys.argv[1]
    dry_run = "--apply" not in sys.argv
    
    if not os.path.exists(changes_file):
        print(f"Error: Changes file not found: {changes_file}")
        sys.exit(1)
    
    print(f"Loading changes from: {changes_file}")
    changes_data = load_json_file(changes_file)
    
    if changes_data is None:
        sys.exit(1)
    
    # Extract target files from changes
    target_files = set()
    for change in changes_data.get('changes', []):
        target_files.add(change['file'])
    for delete in changes_data.get('deletes', []):
        target_files.add(delete['file'])
    
    if not target_files:
        print("No target files found in changes")
        sys.exit(0)
    
    # Create validation backups
    print(f"\nCreating validation backups...")
    timestamp = create_validation_backups(changes_file, target_files)
    
    # Apply changes
    print(f"\n{'DRY RUN MODE' if dry_run else 'APPLYING CHANGES'}")
    print("=" * 50)
    
    success = apply_changes(changes_data, dry_run)
    
    if success:
        if dry_run:
            print(f"\n✓ Dry run completed successfully!")
            print(f"Validation files created with timestamp: {timestamp}")
            print(f"To apply changes, run: python apply-question-changes.py {changes_file} --apply")
        else:
            print(f"\n✓ Changes applied successfully!")
            print(f"Validation files created with timestamp: {timestamp}")
            print(f"Run validation script to verify changes")
    else:
        print(f"\n✗ Failed to apply changes")
        sys.exit(1)

if __name__ == "__main__":
    main() 