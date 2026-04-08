/**
 * wikmd EasyMDE integration
 *
 * All EasyMDE initialisation lives here so that swapping the editor only
 * requires changes to this file, not to any Jinja template.
 *
 * ── Extending the toolbar ────────────────────────────────────────────────────
 * Push an extension object onto window.wikmdEditorExtensions BEFORE the
 * inline <script> in new.html calls initWikmdEditor().
 *
 *   window.wikmdEditorExtensions = window.wikmdEditorExtensions || [];
 *   window.wikmdEditorExtensions.push({
 *
 *     // Optional: receive the current toolbar array, return a modified one.
 *     // Use this to add, remove or reorder buttons.
 *     toolbar: function(items) {
 *       return items.concat(["|", {
 *         name:   "my-button",
 *         action: function(editor) { editor.value(editor.value() + "\n> note"); },
 *         className: "fa fa-pencil",
 *         title:  "My custom action",
 *       }]);
 *     },
 *
 *     // Optional: mutate the full EasyMDE config object before the instance
 *     // is created.  Use this to set any option not exposed above.
 *     config: function(cfg) {
 *       cfg.spellChecker = true;
 *     },
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
    "use strict";

    var DEFAULT_TOOLBAR = [
        "bold", "italic", "strikethrough", "heading", "|",
        "quote", "unordered-list", "ordered-list", "horizontal-rule", "|",
        "link", "image", "table", "|",
        "code", "|",
        "preview", "side-by-side", "fullscreen", "|",
        "undo", "redo",
    ];

    /** Extension registry – populated by the page before initWikmdEditor(). */
    window.wikmdEditorExtensions = window.wikmdEditorExtensions || [];

    /** Dropdown configs collected while the toolbar array is being assembled. */
    var _pendingDropdowns = [];

    /**
     * Create and mount the EasyMDE editor.
     *
     * @param {object}  options
     * @param {string}  options.uploadPath  Image-upload route, e.g. "img"
     * @param {boolean} options.canEdit     When false the toolbar is hidden
     * @param {boolean} options.darkTheme   Apply the ayu-mirage CodeMirror theme
     */
    window.initWikmdEditor = function (options) {
        var canEdit = options.canEdit !== false;

        // --- Build toolbar, let extensions modify it -------------------------
        var toolbar = DEFAULT_TOOLBAR.slice();
        window.wikmdEditorExtensions.forEach(function (ext) {
            if (typeof ext.toolbar === "function") {
                toolbar = ext.toolbar(toolbar);
            }
        });

        // --- Base EasyMDE config ---------------------------------------------
        var editorConfig = {
            element:         document.getElementById("content"),
            toolbar:         canEdit ? toolbar : false,
            spellChecker:    false,
            renderingConfig: { singleLineBreaks: false },
        };

        // --- Let extensions mutate the config before creation ----------------
        window.wikmdEditorExtensions.forEach(function (ext) {
            if (typeof ext.config === "function") {
                ext.config(editorConfig);
            }
        });

        // --- Create the editor -----------------------------------------------
        var editor = new EasyMDE(editorConfig);

        if (options.darkTheme) {
            editor.codemirror.setOption("theme", "ayu-mirage");
        }

        // --- Ctrl+S: async save without page navigation ----------------------
        editor.codemirror.on("keydown", function (cm, e) {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                _submitAsync(editor);
            }
        });

        // --- Sync textarea value on regular form submit ----------------------
        document.getElementById("form").addEventListener("submit", function () {
            document.getElementById("content").value = editor.value();
        });

        // --- Unsaved-changes guard -------------------------------------------
        var formSubmitting = false;
        window.setFormSubmitting = function () { formSubmitting = true; };

        window.addEventListener("beforeunload", function (e) {
            if (formSubmitting) { return undefined; }

            var loaded  = document.getElementById("content").value;
            var current = editor.value();
            var dirty   = (current !== loaded)
                       || (current !== "" && loaded === "")
                       || (loaded  !== "" && document.URL.endsWith("add_new"));

            if (!dirty) { return undefined; }

            var msg = "You have unsaved changes. If you leave before saving, your changes will be lost.";
            (e || window.event).returnValue = msg;
            return msg;
        });

        // --- Inject dropdown DOM into the toolbar -------------------------
        if (_pendingDropdowns.length) {
            var editorToolbar = editor.codemirror.getWrapperElement()
                                      .parentElement
                                      .querySelector(".editor-toolbar");
            _injectDropdowns(editor, editorToolbar);
            _pendingDropdowns = [];
        }

        // Mark body so CSS can target dark-mode dropdown styles
        if (options.darkTheme) {
            document.body.setAttribute("data-wikmd-theme", "dark");
        }

        // Close any open dropdown when clicking outside the toolbar
        document.addEventListener("click", function (e) {
            var open = document.querySelectorAll(".wikmd-toolbar-dropdown.show");
            open.forEach(function (m) {
                if (!m.parentElement.contains(e.target)) {
                    m.classList.remove("show");
                }
            });
        });

        // Expose for debugging / external scripts
        window._wikmdEditor = editor;
    };

    // ─── Toolbar Dropdown Helper ──────────────────────────────────────────────
    //
    // Usage (inside an extension's toolbar() callback):
    //
    //   wikmdToolbarDropdown({
    //     name:      "my-dropdown",      // unique; becomes the button's [name] attr
    //     title:     "Insert component", // tooltip
    //     className: "bi bi-layout-text-window-reverse",
    //     items: [
    //       { label: "Group", children: [
    //           { label: "Item A", snippet: "..." },
    //           { label: "Dynamic", snippet: function() { return "..." } },
    //       ]},
    //       { separator: true },         // plain horizontal divider
    //       { label: "Top-level item", snippet: "..." },
    //     ],
    //   })
    //
    //  The dropdown DOM is built once at editor init time and injected into the
    //  toolbar as a sibling of its trigger button (inside a .wikmd-dd-wrapper).
    //  Visibility is toggled with the .show CSS class — no absolute positioning
    //  hacks or document.body appends needed.
    //
    window.wikmdToolbarDropdown = function (options) {
        // Register for post-init DOM injection
        _pendingDropdowns.push(options);

        return {
            name:      options.name,
            title:     options.title,
            className: options.className,
            // EasyMDE calls action() when the button is clicked.
            // At that point the DOM is already injected; just toggle .show.
            action: function (editor) {
                var cmWrapper = editor.codemirror.getWrapperElement();
                var eToolbar  = cmWrapper.parentElement
                                         .querySelector(".editor-toolbar");
                var btn = eToolbar
                    ? eToolbar.querySelector("button[name=\"" + options.name + "\"]")
                    : null;
                if (!btn) return;
                var menu = btn.parentElement.querySelector(".wikmd-toolbar-dropdown");
                if (!menu) return;

                // Close every other open dropdown first
                document.querySelectorAll(".wikmd-toolbar-dropdown.show").forEach(function (m) {
                    if (m !== menu) m.classList.remove("show");
                });

                menu.classList.toggle("show");
            },
        };
    };

    /**
     * Walk _pendingDropdowns, find each trigger button in the rendered toolbar,
     * wrap it in .wikmd-dd-wrapper, and append the pre-built menu inside.
     */
    function _injectDropdowns(editor, toolbar) {
        _pendingDropdowns.forEach(function (options) {
            var btn = toolbar
                ? toolbar.querySelector("button[name=\"" + options.name + "\"]")
                : null;
            if (!btn) return;

            // Wrap button so the dropdown can be position:absolute relative to it
            var wrapper = document.createElement("span");
            wrapper.className = "wikmd-dd-wrapper";
            btn.parentNode.insertBefore(wrapper, btn);
            wrapper.appendChild(btn);

            var menu = _buildMenu(editor, options.items);
            wrapper.appendChild(menu);
        });
    }

    function _buildMenu(editor, items) {
        var menu = document.createElement("div");
        menu.className = "wikmd-toolbar-dropdown";

        (items || []).forEach(function (item) {

            // Plain divider line
            if (item.separator && !item.children) {
                var sep = document.createElement("div");
                sep.className = "wikmd-dd-sep";
                menu.appendChild(sep);
                return;
            }

            // Group item — has children that open as a flyout submenu on hover
            if (item.children) {
                var group = document.createElement("div");
                group.className = "wikmd-dd-group";

                var groupBtn = document.createElement("button");
                groupBtn.type = "button";
                groupBtn.className = "wikmd-dd-group-btn";
                groupBtn.innerHTML = _esc(item.label)
                    + "<span class=\"wikmd-dd-arrow\" aria-hidden=\"true\">&#9654;</span>";
                group.appendChild(groupBtn);

                var submenu = _buildMenu(editor, item.children);
                submenu.className += " wikmd-dd-submenu";
                group.appendChild(submenu);

                // On hover choose left or right direction based on available space
                group.addEventListener("mouseenter", function () {
                    var pRect = menu.getBoundingClientRect();
                    var fits  = (pRect.right + (submenu.offsetWidth || 220)) <= window.innerWidth;
                    submenu.classList.toggle("wikmd-dd-submenu-left", !fits);
                });

                menu.appendChild(group);
                return;
            }

            // Leaf action item
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = item.label || "";
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                // Close all open menus (use .show class approach)
                document.querySelectorAll(".wikmd-toolbar-dropdown.show").forEach(function (m) {
                    m.classList.remove("show");
                });
                editor.codemirror.focus();
                var snippet = typeof item.snippet === "function" ? item.snippet() : (item.snippet || "");
                editor.codemirror.getDoc().replaceSelection(snippet);
            });
            menu.appendChild(btn);
        });

        return menu;
    }

    function _esc(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // -------------------------------------------------------------------------

    function _submitAsync(editor) {
        document.getElementById("content").value = editor.value();
        var xhr  = new XMLHttpRequest();
        var data = new FormData(document.getElementById("form"));
        xhr.open("POST", window.location.href, true);
        xhr.send(data);
    }

}());
