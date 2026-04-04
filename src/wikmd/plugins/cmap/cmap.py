import os

from flask import Flask
from wikmd.config import WikmdConfig
from wikmd.plugins.tag_plugin_base import TagPluginBase, TagVariations, TagParams


class Plugin(TagPluginBase):
    tag_name = "cmap"
    name     = "Control Mapping Icons"
    plugname = "cmap"

    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        super().__init__(flask_app, config, web_dep)
        self.this_location = os.path.dirname(__file__)

    def render(self, variations: TagVariations, params: TagParams) -> str:
        """
        [[cmap:stick]]                           → <span class='cmap stick'>
        [[cmap:stick size="sm"]]                 → <span class='cmap cmap-sm stick'>
        [[cmap:stick size="lg"]]                 → <span class='cmap cmap-lg stick'>
        [[cmap:stick label="left stick"]]        → aria-label='left stick'
        All variations become space-separated CSS classes after the base 'cmap' class.
        """
        icon_classes = variations.as_classes()

        size_param = params.get("size")
        size_tokens = {"sm", "lg"}
        size_class = ""
        if size_param and size_param.value in size_tokens:
            size_class = f"cmap-{size_param.value} "

        label_param = params.get("label")
        label = label_param.value if label_param else (icon_classes or self.tag_name)

        return f"<span class='cmap {size_class}{icon_classes}' role='img' aria-label='{label}' title='{label}'></span>"



