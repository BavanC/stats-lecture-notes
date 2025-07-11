#!/usr/bin/env python3
"""
Simple HTTP server for testing the lecture notes locally.
This allows the HTML files to load CSV data without CORS issues.
Now with a killswitch: type 'end' and press Enter to stop the server.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path
import threading
import webbrowser

def main():
    # Get the directory containing this script
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the script directory
    os.chdir(script_dir)
    
    # Set up the server
    PORT = 8000
    
    # Create a custom handler that serves files with proper MIME types
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Add CORS headers to allow local development
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def guess_type(self, path):
            # Ensure CSV files are served with correct MIME type
            if str(path).endswith('.csv'):
                return 'text/csv'
            return super().guess_type(path)
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 Local server started!")
            print(f"📁 Serving files from: {script_dir}")
            print(f"🌐 Open your browser and go to:")
            print(f"   http://localhost:{PORT}")
            print(f"")
            print(f"📖 To view the moderation lecture:")
            print(f"   http://localhost:{PORT}/spring/lecture-moderation.html")
            print(f"")
            print(f"⏹️  Type 'end' and press Enter to stop the server")
            print(f"=" * 50)

            # Open index.html in the default web browser
            webbrowser.open(f"http://localhost:{PORT}/index.html")

            # Start a thread to listen for 'end' input
            def killswitch():
                while True:
                    user_input = input()
                    if user_input.strip().lower() == 'end':
                        print("\n🛑 Killswitch activated. Stopping server...")
                        httpd.shutdown()
                        break
            threading.Thread(target=killswitch, daemon=True).start()

            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use.")
            print(f"💡 Try a different port or stop the existing server.")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main() 