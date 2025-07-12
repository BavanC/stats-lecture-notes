#!/usr/bin/env python3
"""
Script to validate that question changes were applied correctly.
Compares files in .testing/validation/ with the current files.
"""

import json
import os
import sys
import glob
from pathlib import Path

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

def find_validation_files(validation_dir=".testing/validation", timestamp=None):
    """Find validation files, optionally filtered by timestamp."""
    validation_path = Path(validation_dir)
    if not validation_path.exists():
        print(f"Error: Validation directory not found: {validation_dir}")
        return None, None
    
    # Find changes file
    if timestamp:
        changes_pattern = f"changes_{timestamp}.json"
    else:
        changes_pattern = "changes_*.json"
    
    changes_files = list(validation_path.glob(changes_pattern))
    if not changes_files:
        print(f"Error: No changes file found in {validation_dir}")
        if timestamp:
            print(f"Looking for pattern: {changes_pattern}")
        return None, None
    
    # Use the most recent if multiple found
    changes_file = max(changes_files, key=lambda x: x.stat().st_mtime)
    print(f"Using changes file: {changes_file}")
    
    # Extract timestamp from filename
    file_timestamp = changes_file.stem.split('_', 1)[1] if '_' in changes_file.stem else None
    
    # Find corresponding backup files
    backup_files = {}
    if file_timestamp:
        for backup_file in validation_path.glob(f"*_{file_timestamp}.json"):
            if backup_file != changes_file:
                original_name = backup_file.stem.rsplit('_', 1)[0] + '.json'
                backup_files[original_name] = backup_file
    
    return changes_file, backup_files

def validate_changes(changes_file, backup_files):
    """Validate that changes were applied correctly."""
    print(f"Loading changes from: {changes_file}")
    changes_data = load_json_file(changes_file)
    
    if changes_data is None:
        return False
    
    changes = changes_data.get('changes', [])
    deletes = changes_data.get('deletes', [])
    
    if not changes and not deletes:
        print("No changes or deletes found in the file")
        return True
    
    all_valid = True
    
    # Validate changes
    for change in changes:
        filepath = change['file']
        question_id = change['question_id']
        field = change['field']
        expected_value = change['new_value']
        
        # Load current file
        current_data = load_json_file(filepath)
        if current_data is None:
            print(f"✗ Could not load current file: {filepath}")
            all_valid = False
            continue
        
        # Load backup file
        backup_file = backup_files.get(filepath)
        if backup_file is None:
            print(f"⚠ Warning: No backup found for {filepath}")
            continue
        
        backup_data = load_json_file(backup_file)
        if backup_data is None:
            print(f"✗ Could not load backup file: {backup_file}")
            all_valid = False
            continue
        
        # Find the question in both files
        current_question = None
        backup_question = None
        
        for question in current_data:
            if question.get('id') == question_id:
                current_question = question
                break
        
        for question in backup_data:
            if question.get('id') == question_id:
                backup_question = question
                break
        
        if current_question is None:
            print(f"✗ Question {question_id} not found in current {filepath}")
            all_valid = False
            continue
        
        if backup_question is None:
            print(f"✗ Question {question_id} not found in backup {backup_file}")
            all_valid = False
            continue
        
        # Check if the field was changed correctly
        current_value = current_question.get(field)
        backup_value = backup_question.get(field)
        
        if current_value == expected_value:
            print(f"✓ Change validated: {filepath} - Question {question_id} - {field}: '{backup_value}' → '{current_value}'")
        else:
            print(f"✗ Change validation failed: {filepath} - Question {question_id} - {field}")
            print(f"  Expected: '{expected_value}'")
            print(f"  Found: '{current_value}'")
            print(f"  Backup had: '{backup_value}'")
            all_valid = False
    
    # Validate deletes
    for delete in deletes:
        filepath = delete['file']
        question_id = delete['question_id']
        
        # Load current file
        current_data = load_json_file(filepath)
        if current_data is None:
            print(f"✗ Could not load current file: {filepath}")
            all_valid = False
            continue
        
        # Load backup file
        backup_file = backup_files.get(filepath)
        if backup_file is None:
            print(f"⚠ Warning: No backup found for {filepath}")
            continue
        
        backup_data = load_json_file(backup_file)
        if backup_data is None:
            print(f"✗ Could not load backup file: {backup_file}")
            all_valid = False
            continue
        
        # Check if question exists in backup but not in current
        question_in_backup = any(q.get('id') == question_id for q in backup_data)
        question_in_current = any(q.get('id') == question_id for q in current_data)
        
        if question_in_backup and not question_in_current:
            print(f"✓ Delete validated: Question {question_id} removed from {filepath}")
        elif not question_in_backup:
            print(f"⚠ Warning: Question {question_id} was not in backup {backup_file}")
        elif question_in_current:
            print(f"✗ Delete validation failed: Question {question_id} still exists in {filepath}")
            all_valid = False
        else:
            print(f"⚠ Warning: Question {question_id} not found in either backup or current {filepath}")
    
    return all_valid

def list_available_timestamps(validation_dir=".testing/validation"):
    """List available timestamps in the validation directory."""
    validation_path = Path(validation_dir)
    if not validation_path.exists():
        print(f"Validation directory not found: {validation_dir}")
        return
    
    changes_files = list(validation_path.glob("changes_*.json"))
    if not changes_files:
        print(f"No validation files found in {validation_dir}")
        return
    
    print("Available validation timestamps:")
    for changes_file in sorted(changes_files, key=lambda x: x.stat().st_mtime, reverse=True):
        timestamp = changes_file.stem.split('_', 1)[1] if '_' in changes_file.stem else "unknown"
        mtime = changes_file.stat().st_mtime
        print(f"  {timestamp} (created {os.path.getctime(changes_file):.0f})")

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate-question-changes.py <validation_dir> [timestamp]")
        print("  validation_dir: Directory containing validation files (default: .testing/validation)")
        print("  timestamp: Specific timestamp to validate (optional)")
        print("\nExamples:")
        print("  python validate-question-changes.py")
        print("  python validate-question-changes.py .testing/validation")
        print("  python validate-question-changes.py .testing/validation 20241201_143022")
        print("\nTo list available timestamps:")
        print("  python validate-question-changes.py --list")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        list_available_timestamps()
        sys.exit(0)
    
    validation_dir = sys.argv[1] if len(sys.argv) > 1 else ".testing/validation"
    timestamp = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"Validating changes from: {validation_dir}")
    if timestamp:
        print(f"Using timestamp: {timestamp}")
    
    changes_file, backup_files = find_validation_files(validation_dir, timestamp)
    
    if changes_file is None:
        sys.exit(1)
    
    if backup_files is None:
        backup_files = {}
    
    print(f"Found {len(backup_files)} backup files:")
    for original, backup in backup_files.items():
        print(f"  {original} → {backup}")
    
    print(f"\nValidating changes...")
    print("=" * 50)
    
    success = validate_changes(changes_file, backup_files)
    
    if success:
        print(f"\n✓ All changes validated successfully!")
    else:
        print(f"\n✗ Some changes failed validation")
        sys.exit(1)

if __name__ == "__main__":
    main() 