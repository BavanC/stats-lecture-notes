# Local Development Guide

This guide explains how to test the lecture notes locally with the CSV data files.

## The Problem

When you open the HTML files directly in a browser (using `file://` protocol), the browser blocks `fetch()` requests to local files for security reasons. This means the charts won't load the CSV data.

## Solution: Local HTTP Server

We've provided several ways to start a local HTTP server:

### Option 1: Python Script (Recommended)

1. **Windows**: Double-click `start-local-server.bat`
2. **Mac/Linux**: Run `./start-local-server.sh` in terminal
3. **Manual**: Run `python start-local-server.py` in terminal

### Option 2: Built-in Python Server

If you have Python installed, you can also use:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 3: Node.js (if you have it)

```bash
npx http-server -p 8000
```

## Using the Local Server

1. Start one of the server options above
2. Open your browser and go to: `http://localhost:8000`
3. Navigate to the lecture file you want to test:
   - Moderation lecture: `http://localhost:8000/spring/lecture-moderation.html`
   - Other lectures: Browse the directory structure

## File Structure

```
stats-lecture-notes/
├── start-local-server.py          # Python server script
├── start-local-server.bat         # Windows batch file
├── start-local-server.sh          # Unix/Linux shell script
├── spring/
│   └── lecture-moderation.html    # Main lecture file
└── resources/
    └── moderation-data/           # CSV data files
        ├── bar-chart-data.csv
        ├── raw-bar-chart-data.csv
        ├── scatter-plot-data.csv
        ├── low-interactivity-data.csv
        └── high-interactivity-data.csv
```

## Benefits of This Approach

- ✅ Test locally without GitHub Pages
- ✅ Easy to modify CSV data and see changes immediately
- ✅ Proper CORS headers for development
- ✅ Correct MIME types for CSV files
- ✅ Works on all operating systems

## Troubleshooting

**Port already in use**: Try a different port by editing the `PORT = 8000` line in `start-local-server.py`

**Python not found**: Make sure Python is installed and in your PATH

**Permission denied**: On Unix/Linux, make the shell script executable: `chmod +x start-local-server.sh` 