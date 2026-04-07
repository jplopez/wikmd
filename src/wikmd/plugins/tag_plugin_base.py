"""
TagPluginBase — base class for wikmd tag plugins.

Canonical syntax:
    [[tag_name:var1.var2.var3 param1="value1" param2="value2"]]

- tag_name : alphanumeric, dashes, underscores.
- variations: dot-separated identifiers after the colon (optional).
- params    : zero or more key="value" or key='value' pairs (optional).

Two rendering modes — implement ONE of:

  render(variations, params) -> str
      Runs BEFORE pandoc. Use for tags whose output only depends on the tag
      arguments (e.g. icons, sprites). This is the common case.

  render_html(page_html, variations, params) -> str
      Runs AFTER pandoc. Use for tags whose output depends on the rendered
      HTML content of the page (e.g. Table of Contents that scans headings).
      The base class automatically emits a placeholder pre-pandoc and
      replaces it with the result of render_html() in process_before_cache_html.
"""

import re
from typing import Optional, Union

from flask import Flask
from wikmd.config import WikmdConfig


# ---------------------------------------------------------------------------
# TagVariations
# ---------------------------------------------------------------------------

class TagVariations:
    """
    Dot-separated variations from the tag token, e.g. "stick.nin.alt"
    is parsed as ["stick", "nin", "alt"].
    """

    def __init__(self, raw: str):
        self._items: list[str] = [v for v in raw.split(".") if v] if raw else []

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __repr__(self) -> str:
        return f"TagVariations({self._items!r})"

    def get(self, n: int, default: Optional[str] = None) -> Optional[str]:
        """Returns the variation at index n, or default if out of range."""
        try:
            return self._items[n]
        except IndexError:
            return default

    def as_classes(self) -> str:
        """Returns all variations joined as space-separated CSS classes."""
        return " ".join(self._items)


# ---------------------------------------------------------------------------
# TagParam  (single parameter)
# ---------------------------------------------------------------------------

class TagParam:
    """
    A single key/value parameter with conversion helpers.
    """

    def __init__(self, name: str, value: str):
        self.name = name
        self.value = value

    def __repr__(self) -> str:
        return f"TagParam({self.name!r}, {self.value!r})"

    def split(self, delimiter: str = ",") -> list[str]:
        """Splits the value by delimiter, stripping whitespace from each part."""
        return [v.strip() for v in self.value.split(delimiter)]

    def get_part(self, n: int, delimiter: str = ",", default: Optional[str] = None) -> Optional[str]:
        """Returns the nth item after splitting the value by delimiter."""
        try:
            return self.split(delimiter)[n]
        except IndexError:
            return default

    def as_number(self) -> Optional[Union[int, float]]:
        """
        Casts the value to int or float.
        Returns float if the value contains a dot, int otherwise.
        Returns None if the value is not numeric.
        """
        try:
            return float(self.value) if "." in self.value else int(self.value)
        except (ValueError, TypeError):
            return None

    def as_bool(self) -> Optional[bool]:
        """
        Casts the value to bool.
        Truthy : "true", "1", "yes", "on"
        Falsy  : "false", "0", "no", "off"
        Returns None for unrecognized values.
        """
        low = self.value.lower()
        if low in ("true", "1", "yes", "on"):
            return True
        if low in ("false", "0", "no", "off"):
            return False
        return None


# ---------------------------------------------------------------------------
# TagParams  (ordered collection of TagParam)
# ---------------------------------------------------------------------------

class TagParams:
    """
    Ordered collection of TagParam objects parsed from a parameter string.
    Parameters can be retrieved by name (str) or insertion order (int).
    Both single and double quotes are accepted as value delimiters.
    """

    def __init__(self, raw: str):
        self._items: list[TagParam] = []
        for m in re.finditer(r'([\w-]+)=["\']([^"\']*)["\']', raw):
            self._items.append(TagParam(m.group(1), m.group(2)))

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __repr__(self) -> str:
        return f"TagParams({self._items!r})"

    def get(self, key: Union[str, int], default: Optional[TagParam] = None) -> Optional[TagParam]:
        """
        Returns a TagParam by name (str) or position (int).
        Returns default if not found or out of range.
        """
        if isinstance(key, int):
            try:
                return self._items[key]
            except IndexError:
                return default
        for param in self._items:
            if param.name == key:
                return param
        return default


# ---------------------------------------------------------------------------
# TagPluginBase
# ---------------------------------------------------------------------------

class TagPluginBase:
    """
    Base class for wikmd tag plugins.

    Usage — subclass and set these three class attributes plus implement render():

        class Plugin(TagPluginBase):
            tag_name = "my-tag"
            name     = "My Tag Plugin"
            plugname = "my-tag"

            def __init__(self, flask_app, config, web_dep):
                super().__init__(flask_app, config, web_dep)

            def render(self, variations: TagVariations, params: TagParams) -> str:
                icon = variations.get(0, "")
                label = params.get("label")
                return f"<span class='{self.tag_name} {icon}'>{label.value if label else icon}</span>"
    """

    tag_name: str = ""
    name: str = ""
    plugname: str = ""

    debug: bool = True
    
    def __init__(self, flask_app: Flask, config: WikmdConfig, web_dep):
        self.flask_app = flask_app
        self.config = config
        self.web_dep = web_dep

    def get_plugin_name(self) -> str:
        return self.name

    def process_md_before_html_convert(self, md: str) -> str:
        """Replaces all [[tag_name:...]] occurrences with render() output."""
        self._log('process_md_before_html_convert')
        tag = re.escape(self.tag_name)
        pattern = rf'\[\[{tag}(?::([^\s\[\]]*))?\s*(.*?)\s*\]\]'
        self._log(f'tag: {tag}')
        self._log(f'pattern: {pattern}')

        def _replace(match) -> str:
            variations = TagVariations(match.group(1) or "")
            params = TagParams(match.group(2) or "")
            self._log('calling render:')
            self._log(f'  variations {variations}')
            self._log(f'  params {params}')
            return self.render(variations, params)

        return re.sub(pattern, _replace, md, flags=re.IGNORECASE)

    def render(self, variations: TagVariations, params: TagParams) -> str:
        """Implement in subclass to produce the HTML string for a matched tag."""
        raise NotImplementedError(
            f"TagPlugin '{self.tag_name}' must implement render()"
        )
    
    def _log(self, message: str):
      if self.debug:  
        print(f'TagPlugin {self.tag_name} - {message}')
