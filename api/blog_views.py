#!/usr/bin/env python3
"""Minimal same-origin RoadToA blog view counter API."""

import json
import os
import re
import sqlite3
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

HOST = "127.0.0.1"
PORT = int(os.environ.get("ROADTOA_VIEWS_PORT", "4511"))
DB_PATH = os.environ.get("ROADTOA_VIEWS_DB", "/var/lib/roadtoa-views/views.sqlite3")
VALID_POST_IDS = frozenset(
    {"procrastination", "tests", "mental-health", "wellness", "motivation", "welcome"}
)
ROUTE_RE = re.compile(r"^/api/blog/([^/]+)/view$")


def connect():
    connection = sqlite3.connect(DB_PATH, timeout=5)
    connection.execute("PRAGMA busy_timeout = 5000")
    connection.execute(
        "CREATE TABLE IF NOT EXISTS post_views "
        "(post_id TEXT PRIMARY KEY, view_count INTEGER NOT NULL DEFAULT 0 CHECK(view_count >= 0))"
    )
    return connection


def initialize_database():
    connection = connect()
    try:
        connection.execute("PRAGMA journal_mode = WAL")
    finally:
        connection.close()


def increment(post_id):
    connection = connect()
    try:
        with connection:
            connection.execute(
                "INSERT INTO post_views(post_id, view_count) VALUES (?, 1) "
                "ON CONFLICT(post_id) DO UPDATE SET view_count = view_count + 1",
                (post_id,),
            )
            row = connection.execute(
                "SELECT view_count FROM post_views WHERE post_id = ?", (post_id,)
            ).fetchone()
        return row[0]
    finally:
        connection.close()


class ViewHandler(BaseHTTPRequestHandler):
    server_version = "RoadToAViews/1"

    def send_json(self, status, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        match = ROUTE_RE.fullmatch(urlsplit(self.path).path)
        post_id = unquote(match.group(1)) if match else None
        if post_id not in VALID_POST_IDS:
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "post not found"})
            return
        try:
            view_count = increment(post_id)
        except (OSError, sqlite3.Error):
            self.send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"error": "counter unavailable"})
            return
        self.send_json(HTTPStatus.OK, {"postId": post_id, "viewCount": view_count})

    def do_GET(self):
        self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "POST required"})

    def do_PUT(self):
        self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "POST required"})

    def do_PATCH(self):
        self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "POST required"})

    def do_DELETE(self):
        self.send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "POST required"})

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    initialize_database()
    with ThreadingHTTPServer((HOST, PORT), ViewHandler) as server:
        server.serve_forever()
