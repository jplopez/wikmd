import os
import re

from flask import Flask, request
from wikmd.config import WikmdConfig
from wikmd.plugins.tag_plugin_base import TagPluginBase, TagVariations, TagParams


# Class-only placeholder — survives pandoc and lxml.clean_html intact.
# Loose regex handles any whitespace pandoc may insert inside the empty div.
_PLACEHOLDER_RE = re.compile(r'<div class="wikmd-pd"[^>]*>\s*</div>', re.DOTALL)
_DIV_TAG_CLOSE = '</div>'

class Plugin(TagPluginBase):
    tag_name = "pagedirectory"
    name     = "Page Directory"
    plugname = "pagedirectory"

    # html tags 
    _tag_wrapper_open = '<div class="wikmd-page-dir card mb-4" aria-label="Page Directory">'
    _tag_wrapper_close = _DIV_TAG_CLOSE
    _tag_head_open = '<div class="card-header fw-bold">'
    _tag_head_inner = 'Pages'
    _tag_head_close = _DIV_TAG_CLOSE
    _tag_body_open = '<div class="card-body py-2">'
    _tag_body_close = _DIV_TAG_CLOSE
    _tag_list_open = '<ul class="list-group ms-3 mb-0">'
    _tag_list_close = '</ul>'
    _tag_item_open = '<li class="list-group-item">'
    _tag_item_close = '</li>'

    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        super().__init__(flask_app, config, web_dep)

    def render(self, variations: TagVariations, params: TagParams) -> str:
        """
        Pre-pandoc: emit a class-only placeholder.
        
        Captures params: title
        """
        self._tag_head_inner = 'Pages'
        if params.get("title"): self._tag_head_inner = params.get("title").value
        return '<div class="wikmd-pd"></div>'

    def process_html(self, html: str) -> str:
        """Runs every request so newly added pages appear immediately."""
        if not _PLACEHOLDER_RE.search(html):
            return html
        tree_html = self._build_directory(request.path)
        return _PLACEHOLDER_RE.sub(lambda _: tree_html, html)

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
        base_url = ('/' + page_path) if page_path else ''

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
            f'{self._tag_wrapper_open}\n'
            f'  {self._tag_head_open} {self._tag_head_inner} {self._tag_head_close} \n'
            f'   {self._tag_body_open} {tree} {self._tag_body_close} \n'
            f'{self._tag_wrapper_close}'
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
                        f'<span class="bi bi-folder fw-semibold"> {entry.name}/</span>'
                        f'{subtree}'
                        f'</li>'
                    )

            elif entry.is_file() and entry.name.lower().endswith('.md'):
                page_name = entry.name[:-3]                       # strip .md
                url = f'{base_url}/{page_name}'
                items.append(f'<li> '
                             f'  <a href="{url}">'
                             f'    <span class="bi bi-file-text-fill fw-semibold">{page_name}</span>'
                             '  </a>'
                             '</li>')

        if not items:
            return ''

        return self._tag_list_open + ''.join(items) + self._tag_list_close
