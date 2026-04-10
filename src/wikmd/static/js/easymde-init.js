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

        // Mark body so CSS can target dark-mode styles
        if (options.darkTheme) {
            document.body.setAttribute("data-wikmd-theme", "dark");
        }

        // Expose for debugging / external scripts
        window._wikmdEditor = editor;

        // Run afterInit extensions (only when editing is enabled)
        if (canEdit) {
            window.wikmdEditorExtensions.forEach(function (ext) {
                if (typeof ext.afterInit === "function") {
                    ext.afterInit(editor);
                }
            });
        }
    };

    function _submitAsync(editor) {
        document.getElementById("content").value = editor.value();
        var xhr  = new XMLHttpRequest();
        var data = new FormData(document.getElementById("form"));
        xhr.open("POST", window.location.href, true);
        xhr.send(data);
    }

}());
