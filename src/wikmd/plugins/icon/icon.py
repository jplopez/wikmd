import os

from flask import Flask
from wikmd.config import WikmdConfig
from wikmd.plugins.tag_plugin_base import TagPluginBase, TagVariations, TagParams


class Plugin(TagPluginBase):
    tag_name = "icon"
    name     = "Bootstrap Icons"
    plugname = "icon"

    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        super().__init__(flask_app, config, web_dep)
        self.this_location = os.path.dirname(__file__)

    def render(self, variations: TagVariations, params: TagParams) -> str:
        """
        [[icon:alarm]]
            → <i class="bi bi-alarm">
        [[icon:alarm size="2rem" color="cornflowerblue"]] 
            → with inline style
        The icon name is the first (and typically only) variation.
        """
        icon = variations.get(0, "")

        style_parts = []
        size_param = params.get("size")
        color_param = params.get("color")
        if size_param:
            style_parts.append(f"font-size: {size_param.value}")
        if color_param:
            style_parts.append(f"color: {color_param.value}")

        style_attr = f' style="{'; '.join(style_parts)}"' if style_parts else ''
        ret = f'<i class="bi bi-{icon}"{style_attr} role="img" aria-label="{icon}" title="{icon}"></i>'
        self._log("returned html: " + ret)
        return ret