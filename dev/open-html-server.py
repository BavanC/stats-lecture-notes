import os
import sys
import subprocess
import time
import webbrowser
import signal
import socket

PORT = 8000

# Helper to check if port is in use
def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

# Helper to kill process on port (cross-platform)
def kill_process_on_port(port):
    try:
        if os.name == 'nt':
            # Windows
            result = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
            for line in result.strip().split('\n'):
                if line:
                    parts = line.split()
                    pid = parts[-1]
                    # Skip system processes (PID 0, 4, 8) and invalid PIDs
                    if pid.isdigit() and int(pid) > 8:
                        try:
                            subprocess.call(f'taskkill /PID {pid} /F', shell=True)
                        except:
                            pass  # Ignore if process already gone
        else:
            # Unix/Mac
            result = subprocess.check_output(f'lsof -i :{port} | grep LISTEN', shell=True).decode()
            for line in result.strip().split('\n'):
                if line:
                    pid = int(line.split()[1])
                    os.kill(pid, signal.SIGKILL)
    except Exception as e:
        pass  # If nothing running, ignore

# Get HTML file to open
if len(sys.argv) > 1:
    html_file = sys.argv[1]
else:
    html_file = 'index.html'

# Kill any running server on PORT
if is_port_in_use(PORT):
    print(f"Port {PORT} in use, killing existing server...")
    kill_process_on_port(PORT)
    time.sleep(1)

# Start new server
print(f"Starting server on http://localhost:{PORT}/ ...")
server_proc = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)])
time.sleep(1.5)  # Give server time to start

# Open the HTML file in browser
url_path = html_file.replace('\\', '/').lstrip('.')
if url_path.startswith('/'):
    url_path = url_path[1:]
url = f"http://localhost:{PORT}/{url_path}"
print(f"Opening {url}")
webbrowser.open(url)

# Optionally, keep the script running so the server stays up
try:
    server_proc.wait()
except KeyboardInterrupt:
    print("Shutting down server...")
    server_proc.terminate() 