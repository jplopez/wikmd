import re

from flask import Flask
from wikmd.config import WikmdConfig
from wikmd.plugins.tag_plugin_base import TagPluginBase, TagVariations, TagParams

# Depth encoded in class name — class attribute survives pandoc and lxml.clean_html.
# Pattern is loose (allows optional whitespace inside) to survive pandoc serialization.
_PLACEHOLDER_RE = re.compile(r'<div class="wikmd-toc-d(\d+)"[^>]*>\s*</div>', re.DOTALL)


class Plugin(TagPluginBase):
    tag_name = "toc"
    name     = "Table of Contents"
    plugname = "toc"
    
    DIV_TAG_CLOSE = '</div>'
    # html tags
    _tag_button = '<button class="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasToc" aria-controls="offcanvasToc"><i class="bi bi-list-ol"></i> Table of Contents</button>'
    _tag_wrapper_open = '<div class="offcanvas offcanvas-start"  data-bs-scroll="true" tabindex="-1" id="offcanvasToc" aria-labelledby="offcanvasTocLabel">'
    _tag_wrapper_close = DIV_TAG_CLOSE
  
    _tag_head_open = '<div class="offcanvas-header">'
    _tag_head_inner = '<h5 class="offcanvas-title" id="offcanvasTocLabel">Table of Contents</h5><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>'
    _tag_head_close = DIV_TAG_CLOSE
    
    _tag_body_open = '<div class="offcanvas-body">'
    _tag_body_close = DIV_TAG_CLOSE
    
    
    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        super().__init__(flask_app, config, web_dep)

    def render(self, variations: TagVariations, params: TagParams) -> str:
        """Pre-pandoc: emit a simple placeholder. Depth is in the class name."""
        depth_param = params.get("depth")
        depth = depth_param.value if depth_param else "6"
        return f'<div class="wikmd-toc-d{depth}"></div>'

    def process_before_cache_html(self, html: str) -> str:
        """Post-pandoc: find our placeholder and replace it with the actual TOC."""
        def replace_match(m):
            max_depth = int(m.group(1))
            return self._build_toc(html, max_depth) or ""

        return _PLACEHOLDER_RE.sub(replace_match, html)

    def _build_toc(self, html: str, max_depth: int = 6) -> str:
        heading_re = re.compile(
            r'<h([1-6])[^>]*\bid="([^"]*)"[^>]*>(.*?)</h\1>',
            re.DOTALL | re.IGNORECASE
        )
        raw = [(int(m.group(1)), m.group(2), re.sub(r'<[^>]+>', '', m.group(3)).strip())
               for m in heading_re.finditer(html)]
        items = [(lvl, hid, txt) for lvl, hid, txt in raw if lvl <= max_depth]

        if not items:
            return ''

        lines = []
        depth_stack: list[int] = []

        for level, hid, text in items:
            while depth_stack and depth_stack[-1] > level:
                depth_stack.pop()
                lines.append('</li></ol>')

            if depth_stack and depth_stack[-1] == level:
                lines.append('</li>')
            else:
                lines.append('<ol>')
                depth_stack.append(level)

            lines.append(f'<li><a href="#{hid}">{text}</a>')

        while depth_stack:
            depth_stack.pop()
            lines.append('</li></ol>')

        inner = '\n'.join(lines)
        return (
            f'{self._tag_button}\n'
            f'{self._tag_wrapper_open}\n'
            f'  {self._tag_head_open} {self._tag_head_inner} {self._tag_head_close}\n'
            f'  {self._tag_body_open} {inner} {self._tag_body_close} \n'
            f'{self._tag_wrapper_close}'
        )

    def add_script(self) -> str:
        return """
<script>
(function () {
    var _scrollY = 0;
    document.addEventListener('hide.bs.offcanvas', function (e) {
        if (e.target.id === 'offcanvasToc') {
            _scrollY = window.scrollY;
        }
    });
    document.addEventListener('hidden.bs.offcanvas', function (e) {
        if (e.target.id === 'offcanvasToc') {
            window.scrollTo({ top: _scrollY, behavior: 'instant' });
        }
    });
})();
</script>
"""
