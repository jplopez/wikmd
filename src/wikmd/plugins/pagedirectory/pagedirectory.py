import os
import re

from flask import Flask, request
from wikmd.config import WikmdConfig

_PLACEHOLDER = '<div class="wikmd-pagedirectory-placeholder"></div>'
_PLACEHOLDER_RE = re.compile(r'<div class="wikmd-pagedirectory-placeholder"></div>')


class Plugin:
    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        self.name = "Page Directory"
        self.plugname = "pagedirectory"
        self.flask_app = flask_app
        self.config = config
        self.web_dep = web_dep

    def get_plugin_name(self) -> str:
        return self.name

    # ------------------------------------------------------------------
    # Step 1: Replace [[PageDirectory]] with an HTML placeholder before
    # pandoc so pandoc passes it through unchanged.
    # ------------------------------------------------------------------
    def process_md_before_html_convert(self, md: str) -> str:
        return re.sub(
            r'\[\[\s*PageDirectory\s*\]\]',
            _PLACEHOLDER,
            md,
            flags=re.IGNORECASE
        )

    # ------------------------------------------------------------------
    # Step 2: Resolve the placeholder at request time.
    # Uses request.path to find the current page's sub-folder.
    # Runs every request so newly added pages appear immediately.
    # ------------------------------------------------------------------
    def process_html(self, html: str) -> str:
        if _PLACEHOLDER not in html:
            return html

        tree_html = self._build_directory(request.path)
        return html.replace(_PLACEHOLDER, tree_html)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _build_directory(self, url_path: str) -> str:
        """
        Scans the wiki sub-folder that matches the current page name and
        returns an HTML tree of all pages within it.

        URL  /Gaming/Overview  →  scans wiki_dir/Gaming/Overview/
        If that folder doesn't exist, falls back to wiki_dir/Gaming/
        (the page's parent directory, listing siblings).
        """
        page_path = url_path.strip('/')            # e.g. "Gaming/Overview"
        wiki_dir = self.config.wiki_directory

        # Prefer: a folder with the exact same name as the page
        target_fs = os.path.join(wiki_dir, page_path)
        base_url = '/' + page_path

        if not os.path.isdir(target_fs):
            # Fallback: parent directory (shows siblings)
            parent = '/'.join(page_path.split('/')[:-1])
            target_fs = os.path.join(wiki_dir, parent) if parent else wiki_dir
            base_url = '/' + parent if parent else ''

        tree = self._walk(target_fs, base_url)
        if not tree:
            return (
                '<div class="wikmd-page-dir card mb-4">'
                '<div class="card-header fw-bold">Pages</div>'
                '<div class="card-body text-muted fst-italic">No pages found.</div>'
                '</div>'
            )

        return (
            '<nav class="wikmd-page-dir card mb-4" aria-label="Page Directory">\n'
            '  <div class="card-header fw-bold">Pages</div>\n'
            f'  <div class="card-body py-2">{tree}</div>\n'
            '</nav>'
        )

    def _walk(self, fs_path: str, base_url: str) -> str:
        """Recursively build a nested <ul> for the given filesystem path."""
        try:
            entries = sorted(os.scandir(fs_path), key=lambda e: (e.is_file(), e.name.lower()))
        except OSError:
            return ''

        items = []
        for entry in entries:
            if entry.name.startswith('.'):
                continue

            if entry.is_dir():
                subtree = self._walk(entry.path, f'{base_url}/{entry.name}')
                if subtree:
                    items.append(
                        f'<li>'
                        f'<span class="fw-semibold">{entry.name}/</span>'
                        f'{subtree}'
                        f'</li>'
                    )

            elif entry.is_file() and entry.name.lower().endswith('.md'):
                page_name = entry.name[:-3]                       # strip .md
                url = f'{base_url}/{page_name}'
                items.append(f'<li><a href="{url}">{page_name}</a></li>')

        if not items:
            return ''

        return '<ul class="list-unstyled ms-3 mb-0">' + ''.join(items) + '</ul>'
