import re
import sys

from flask import Flask
from wikmd.config import WikmdConfig


class Plugin:
    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        self.name = "Bootstrap Tables"
        self.plugname = "tables"
        self.flask_app = flask_app
        self.config = config
        self.web_dep = web_dep

    def get_plugin_name(self) -> str:
        return self.name

    def process_html(self, html: str) -> str:
        """
        Wraps pandoc-generated <table> elements with a responsive container
        and injects Bootstrap table classes for improved presentation.
        Uses the dark variant when the wiki is in dark mode.

        Idempotent: strips any existing wrapper applied by a previous run before
        re-applying, so dark/light classes always reflect the current theme state.
        """
        wiki_mod = sys.modules.get('wikmd.wiki') or sys.modules.get('__main__')
        # print(wiki_mod)
        dark = wiki_mod.SYSTEM_SETTINGS.get("darktheme", False) if wiki_mod and hasattr(wiki_mod, 'SYSTEM_SETTINGS') else False
        dark_class = " table-dark" if dark else ""
        table_classes = f"table table-striped table-hover{dark_class}"

        # Strip any wrapper from a previous run (handles stale cached HTML) so
        # this method is idempotent and always reflects the current theme state.
        html = re.sub(r'<div class="table-responsive"><table\b[^>]*>', '<table>', html)
        html = re.sub(r'</table></div>', '</table>', html)

        # Re-wrap with the correct classes for the current theme
        html = re.sub(r'<table>', f'<div class="table-responsive"><table class="{table_classes}">', html)
        html = re.sub(r'</table>', r'</table></div>', html)
        return html
