import re

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

        Transforms:
            <table>...</table>
        Into:
            <div class="table-responsive">
              <table class="table table-striped table-hover[ table-dark]">...</table>
            </div>
        """
        from wikmd.wiki import SYSTEM_SETTINGS
        dark = SYSTEM_SETTINGS.get("darktheme", False)
        dark_class = " table-dark" if dark else ""
        table_classes = f"table table-striped table-hover{dark_class}"

        html = re.sub(
            r'<table\b([^>]*)>',
            rf'<div class="table-responsive"><table class="{table_classes}"\1>',
            html
        )
        html = re.sub(
            r'</table>',
            r'</table></div>',
            html
        )
        return html
