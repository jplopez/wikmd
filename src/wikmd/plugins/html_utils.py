"""
Lightweight HTML-building utilities for wikmd plugins.

Two styles are provided:

  String style (HTMLStr subclass of str):
      HTMLStr("hello").html_tag("li")
      # → "<li>hello</li>"

      HTMLStr("world").html_tag("a", href="/page", class_="nav-link")
      # → '<a href="/page" class="nav-link">world</a>'

  Class style (HTMLUtils static methods):
      HTMLUtils.tag("li", "hello")
      # → "<li>hello</li>"

      HTMLUtils.open_tag("div", class_="card")
      # → '<div class="card">'

      HTMLUtils.close_tag("div")
      # → "</div>"

Attribute naming convention (same as Python's html-building libs):
  Trailing underscore is stripped:  class_="foo"  →  class="foo"
  Underscores become hyphens:       data_id="x"   →  data-id="x"
"""


def _render_attrs(attrs: dict) -> str:
    """Convert a kwargs dict to an HTML attribute string (leading space included)."""
    if not attrs:
        return ""
    parts = []
    for key, val in attrs.items():
        attr = key.rstrip("_").replace("_", "-")
        parts.append(f' {attr}="{val}"')
    return "".join(parts)


class HTMLStr(str):
    """
    A str subclass that adds .html_tag() for wrapping content in HTML tags.
    All methods return HTMLStr so calls can be chained.

    Example:
        HTMLStr("click me").html_tag("a", href="/go")
        # → HTMLStr('<a href="/go">click me</a>')
    """

    def html_tag(self, tag: str, **attrs) -> "HTMLStr":
        """Wrap this string as the content of an HTML element."""
        return HTMLStr(f"<{tag}{_render_attrs(attrs)}>{self}</{tag}>")


class HTMLUtils:
    """Static helpers for building HTML strings."""

    @staticmethod
    def tag(tag: str, content: str = "", **attrs) -> HTMLStr:
        """
        Return a complete HTML element.

            HTMLUtils.tag("li", "hello")
            # → "<li>hello</li>"

            HTMLUtils.tag("a", "click", href="/go", class_="btn")
            # → '<a href="/go" class="btn">click</a>'
        """
        return HTMLStr(f"<{tag}{_render_attrs(attrs)}>{content}</{tag}>")

    @staticmethod
    def open_tag(tag: str, **attrs) -> str:
        """
        Return an opening tag only.

            HTMLUtils.open_tag("div", class_="card")
            # → '<div class="card">'
        """
        return f"<{tag}{_render_attrs(attrs)}>"

    @staticmethod
    def close_tag(tag: str) -> str:
        """
        Return a closing tag only.

            HTMLUtils.close_tag("div")
            # → "</div>"
        """
        return f"</{tag}>"
