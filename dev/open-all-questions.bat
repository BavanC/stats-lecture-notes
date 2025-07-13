@echo off
cd /d "%~dp0\.."
echo Starting server and opening dev/all-questions.html...
python dev/open-html-server.py dev/all-questions.html
pause 