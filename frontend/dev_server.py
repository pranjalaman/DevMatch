# ===== Local dev server for the frontend =====
# The frontend calls the backend at "/api/...", so both need to be on the same address.
# This little server does two things:
#   1. Shows the files in this folder (index.html, css, js)
#   2. Sends every "/api/..." request to the FastAPI backend and gives back its answer
#
# How to use:
#   Terminal 1 (backend):   uvicorn app.main:app --reload --port 8000
#   Terminal 2 (frontend):  python frontend/dev_server.py
#   Then open http://localhost:8080 in the browser.
#
# Only uses Python's built-in modules, so nothing extra to install.

import http.client
import http.server
import os

FRONTEND_PORT = 8080
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000

# Serve files from the folder this script is in (the frontend folder)
FRONTEND_FOLDER = os.path.dirname(os.path.abspath(__file__))

# Windows sometimes guesses the wrong file type (e.g. "text/plain" for .js),
# so we tell the browser the right type ourselves for these files.
FILE_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
}


class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_FOLDER, **kwargs)

    def guess_type(self, path):
        for ending in FILE_TYPES:
            if path.endswith(ending):
                return FILE_TYPES[ending]
        return super().guess_type(path)

    def do_GET(self):
        if self.path.startswith("/api"):
            self.send_to_backend()
        else:
            super().do_GET()

    def do_POST(self):
        self.send_to_backend()

    def do_PUT(self):
        self.send_to_backend()

    def do_PATCH(self):
        self.send_to_backend()

    def do_DELETE(self):
        self.send_to_backend()

    def send_to_backend(self):
        # Read the body the browser sent (if any)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else None

        # Copy the important headers (the cookie keeps the user logged in)
        headers = {}
        for name in ["Content-Type", "Cookie", "Accept"]:
            if self.headers.get(name):
                headers[name] = self.headers.get(name)

        try:
            connection = http.client.HTTPConnection(BACKEND_HOST, BACKEND_PORT, timeout=30)
            connection.request(self.command, self.path, body=body, headers=headers)
            answer = connection.getresponse()
            answer_body = answer.read()
        except OSError:
            message = b'{"error": {"code": "backend_down", "message": "Backend is not running on port 8000."}}'
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(message)))
            self.end_headers()
            self.wfile.write(message)
            return

        # Send the backend's answer back to the browser
        self.send_response(answer.status)
        for name, value in answer.getheaders():
            if name.lower() in ["content-type", "set-cookie"]:
                self.send_header(name, value)
        self.send_header("Content-Length", str(len(answer_body)))
        self.end_headers()
        self.wfile.write(answer_body)
        connection.close()


if __name__ == "__main__":
    print(f"Frontend: http://localhost:{FRONTEND_PORT}")
    print(f"Sending /api requests to http://{BACKEND_HOST}:{BACKEND_PORT}")
    server = http.server.ThreadingHTTPServer(("", FRONTEND_PORT), DevHandler)
    server.serve_forever()
