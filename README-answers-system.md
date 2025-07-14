# Generic Answers System

This system provides a reusable framework for displaying test answers and explanations across different seasons (winter, spring, etc.) using a single JavaScript file.

## How It Works

### 1. Configuration-Driven
The system uses a JSON configuration object stored in the HTML `data-answers-config` attribute to determine:
- Which season the answers are for
- Path to the MCQ JSON file
- Paths to case study JSON files
- Case study numbers

### 2. Generic JavaScript
The `assets/answers.js` file contains the `AnswersApp` class that:
- Reads configuration from HTML
- Dynamically loads JSON data based on config
- Renders MCQs and case studies generically
- Handles all UI interactions (collapsible content, tabs, etc.)

## File Structure

```
assets/
├── answers.js          # Generic answers system (renamed from winter-answers.js)
├── answers.css         # Styling for answers pages
└── shared-menu.html    # Shared navigation menu

practice/
├── winter-answers.html # Winter test answers (configured for winter data)
└── spring-answers.html # Spring test answers (configured for spring data)

resources/
├── winter_test/        # Winter test JSON files
│   ├── winter-test-mcqs.json
│   ├── winter-test-case_study_26.json
│   ├── winter-test-case_study_27.json
│   └── winter-test-case_study_28.json
└── spring_test/        # Spring test JSON files
    ├── spring-test-mcqs.json
    ├── spring-test-case_study_1.json
    ├── spring-test-case_study_2.json
    └── spring-test-case_study_3.json
```

## Configuration Format

```html
<body data-answers-config='{
    "season": "winter",
    "mcqPath": "../resources/winter_test/winter-test-mcqs.json",
    "caseStudies": [
        {"number": 26, "path": "../resources/winter_test/winter-test-case_study_26.json"},
        {"number": 27, "path": "../resources/winter_test/winter-test-case_study_27.json"},
        {"number": 28, "path": "../resources/winter_test/winter-test-case_study_28.json"}
    ]
}'>
```

## JSON Data Format Requirements

### MCQ JSON Format
```json
{
  "questions": [
    {
      "id": "1",
      "question": "What is the question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation of why this is correct"
    }
  ]
}
```

### Case Study JSON Format
```json
{
  "title": "Case Study Title",
  "description": "Brief description",
  "case_study": {
    "research_scenario": "Detailed research scenario text",
    "statistical_tables": {
      "table_name": {
        "title": "Table Title",
        "headers": ["Header 1", "Header 2"],
        "rows": [
          ["Row 1 Col 1", "Row 1 Col 2"],
          ["Row 2 Col 1", "Row 2 Col 2"]
        ]
      }
    }
  },
  "questions": [
    {
      "id": "a",
      "question": "Question text?",
      "answer": "Correct answer text",
      "explanation": "Detailed explanation"
    }
  ]
}
```

## Creating New Season Answers

1. **Create JSON files** in the appropriate `resources/[season]_test/` directory
2. **Create HTML file** (e.g., `practice/[season]-answers.html`)
3. **Configure the HTML** with the correct `data-answers-config`
4. **Update tab buttons** to match your case study numbers
5. **Update content containers** to match your case study numbers

### Example: Adding Summer Answers

1. Create `resources/summer_test/` directory with JSON files
2. Create `practice/summer-answers.html`:

```html
<body data-answers-config='{
    "season": "summer",
    "mcqPath": "../resources/summer_test/summer-test-mcqs.json",
    "caseStudies": [
        {"number": 1, "path": "../resources/summer_test/summer-test-case_study_1.json"},
        {"number": 2, "path": "../resources/summer_test/summer-test-case_study_2.json"}
    ]
}'>
```

3. Update tab buttons to match case study numbers (1, 2)
4. Update content containers to `content-case1`, `content-case2`

## Benefits

- **DRY Principle**: Single JavaScript file handles all seasons
- **Maintainable**: Changes to functionality only need to be made once
- **Scalable**: Easy to add new seasons
- **Consistent**: All seasons have the same UI/UX
- **Configurable**: Each season can have different numbers of case studies

## Backward Compatibility

The system includes fallback configuration for existing winter answers, so the current `winter-answers.html` will continue to work without changes. 