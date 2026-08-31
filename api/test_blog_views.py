import http.client
import os
import sqlite3
import tempfile
import threading
import unittest
import uuid
from pathlib import Path

import blog_views


SITE_ROOT = Path(__file__).resolve().parents[1]


class FrontendIntegrationTests(unittest.TestCase):
    def test_rendered_valid_post_records_one_non_blocking_view(self):
        source = (SITE_ROOT / "blog-post.html").read_text(encoding="utf-8")
        self.assertEqual(source.count("recordBlogView(post.id);"), 1)
        self.assertEqual(source.count("fetch(`/api/blog/${encodeURIComponent(postId)}/view`"), 1)
        self.assertIn("catch(() => {});", source)
        self.assertIn("const validPostIds = new Set(['procrastination', 'tests', 'mental-health', 'wellness', 'motivation', 'welcome']);", source)
        self.assertIn('id="view-count-${post.id}"', source)


class BlogViewsTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        blog_views.DB_PATH = os.path.join(self.temp_dir.name, f"views-{uuid.uuid4().hex}.sqlite3")
        self.server = blog_views.ThreadingHTTPServer(("127.0.0.1", 0), blog_views.ViewHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp_dir.cleanup()

    def request(self, method, path, body=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request(method, path, body=body, headers={"Content-Type": "application/json"})
        response = connection.getresponse()
        data = response.read()
        connection.close()
        return response.status, data

    def test_valid_post_increments_and_ignores_body(self):
        first_status, first_body = self.request("POST", "/api/blog/welcome/view", '{"viewCount":999999}')
        second_status, second_body = self.request("POST", "/api/blog/welcome/view", "not json")
        self.assertEqual(first_status, second_status, 200)
        self.assertIn(b'"viewCount":1', first_body)
        self.assertIn(b'"viewCount":2', second_body)

    def test_invalid_ids_do_not_create_rows(self):
        status, _ = self.request("POST", "/api/blog/nope/view")
        self.assertEqual(status, 404)
        self.assertFalse(os.path.exists(blog_views.DB_PATH))

    def test_get_is_rejected(self):
        status, _ = self.request("GET", "/api/blog/welcome/view")
        self.assertEqual(status, 405)

    def test_concurrent_increments_are_atomic(self):
        results = []
        lock = threading.Lock()

        def increment():
            status, body = self.request("POST", "/api/blog/tests/view")
            with lock:
                results.append((status, body))

        workers = [threading.Thread(target=increment) for _ in range(20)]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join()

        self.assertEqual([status for status, _ in results].count(200), 20)
        with sqlite3.connect(blog_views.DB_PATH) as connection:
            self.assertEqual(
                connection.execute("SELECT view_count FROM post_views WHERE post_id='tests'").fetchone()[0],
                20,
            )


if __name__ == "__main__":
    unittest.main()
