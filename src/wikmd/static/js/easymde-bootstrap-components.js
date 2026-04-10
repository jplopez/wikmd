/**
 * wikmd Bootstrap Components toolbar extension
 *
 * Adds a second toolbar row below the EasyMDE toolbar with one button per
 * component variation.  Groups are separated by a vertical bar.
 * Each button shows a Bootstrap Icon; variations of the same component
 * use the same icon plus a short text label.
 *
 * ── Adding your own components ──────────────────────────────────────────────
 * Edit GROUPS below.  Each group is an array of button definitions:
 *
 *   icon:    Bootstrap Icons class,  e.g. "bi bi-info-circle-fill"
 *   color:   optional colour class,  e.g. "text-info"
 *   label:   optional variant text shown next to the icon
 *   title:   tooltip string
 *   snippet: markdown string OR function () → string
 *
 * ── Fenced-div primer ───────────────────────────────────────────────────────
 * Pandoc converts  ::: {.alert .alert-info role="alert"}  to
 *                  <div class="alert alert-info" role="alert">
 * Bootstrap reads the classes, so the component renders correctly.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
    "use strict";

    /* ── Component groups ──────────────────────────────────────────────────── */

    var GROUPS = [

        // ── Alerts ───────────────────────────────────────────────────────────
        [
            {
                icon:    "bi bi-info-circle-fill",
                color:   "text-info",
                title:   "Alert: Info",
                snippet: "\n::: {.alert .alert-info role=\"alert\"}\n**Note:** Your message here.\n:::\n",
            },
            {
                icon:    "bi bi-check-circle-fill",
                color:   "text-success",
                title:   "Alert: Success",
                snippet: "\n::: {.alert .alert-success role=\"alert\"}\n**Success:** Your message here.\n:::\n",
            },
            {
                icon:    "bi bi-exclamation-triangle-fill",
                color:   "text-warning",
                title:   "Alert: Warning",
                snippet: "\n::: {.alert .alert-warning role=\"alert\"}\n**Warning:** Your message here.\n:::\n",
            },
            {
                icon:    "bi bi-x-octagon-fill",
                color:   "text-danger",
                title:   "Alert: Danger",
                snippet: "\n::: {.alert .alert-danger role=\"alert\"}\n**Danger:** Your message here.\n:::\n",
            },
        ],

        // ── Cards ─────────────────────────────────────────────────────────────
        [
            {
                icon:    "bi bi-card-text",
                title:   "Card",
                snippet: "\n:::: card\n::: card-body\n**Card Title**\n\nCard content goes here.\n:::\n::::\n",
            },
            {
                icon:    "bi bi-card-heading",
                label:   "Head/Foot",
                title:   "Card with Header & Footer",
                snippet: "\n::::: card\n::: card-header\nHeader\n:::\n::: card-body\n**Title**\n\nBody content.\n:::\n::: card-footer\nFooter\n:::\n:::::\n",
            },
        ],

        // ── Grid layout ───────────────────────────────────────────────────────
        [
            {
                icon:    "bi bi-layout-split",
                title:   "Grid: 2 Columns (50/50)",
                snippet: "\n:::: row\n::: col-md-6\nLeft column.\n:::\n\n::: col-md-6\nRight column.\n:::\n::::\n",
            },
            {
                icon:    "bi bi-layout-three-columns",
                title:   "Grid: 3 Columns (33/33/33)",
                snippet: "\n::::: row\n::: col-md-4\nColumn 1.\n:::\n\n::: col-md-4\nColumn 2.\n:::\n\n::: col-md-4\nColumn 3.\n:::\n:::::\n",
            },
            {
                icon:    "bi bi-layout-sidebar",
                title:   "Grid: Sidebar (25/75)",
                snippet: "\n:::: row\n::: col-md-3\nSidebar.\n:::\n\n::: col-md-9\nMain content.\n:::\n::::\n",
            },
        ],

        // ── Callouts ──────────────────────────────────────────────────────────
        [
            {
                icon:    "bi bi-info-square-fill",
                color:   "text-info",
                label:   "Note",
                title:   "Callout: Note",
                snippet: "\n::: {.callout .border-start .border-info .border-3 .ps-3}\n**Note:** Content here.\n:::\n",
            },
            {
                icon:    "bi bi-lightbulb-fill",
                color:   "text-success",
                label:   "Tip",
                title:   "Callout: Tip",
                snippet: "\n::: {.callout .border-start .border-success .border-3 .ps-3}\n**Tip:** Content here.\n:::\n",
            },
            {
                icon:    "bi bi-exclamation-square-fill",
                color:   "text-warning",
                label:   "Important",
                title:   "Callout: Important",
                snippet: "\n::: {.callout .border-start .border-warning .border-3 .ps-3}\n**Important:** Content here.\n:::\n",
            },
        ],

        // ── Accordion ─────────────────────────────────────────────────────────
        [
            {
                icon:    "bi bi-chevron-bar-expand",
                title:   "Accordion",
                snippet: function () {
                    var id = "acc-" + Date.now().toString(36);
                    return [
                        "",
                        "<div class=\"accordion\" id=\"" + id + "\">",
                        "  <div class=\"accordion-item\">",
                        "    <div class=\"accordion-header\">",
                        "      <button class=\"accordion-button\" type=\"button\"",
                        "              data-bs-toggle=\"collapse\"",
                        "              data-bs-target=\"#" + id + "-1\">",
                        "        Section 1",
                        "      </button>",
                        "    </div>",
                        "    <div id=\"" + id + "-1\" class=\"accordion-collapse collapse show\"",
                        "         data-bs-parent=\"#" + id + "\">",
                        "      <div class=\"accordion-body\">",
                        "        Content here.",
                        "      </div>",
                        "    </div>",
                        "  </div>",
                        "  <div class=\"accordion-item\">",
                        "    <div class=\"accordion-header\">",
                        "      <button class=\"accordion-button collapsed\" type=\"button\"",
                        "              data-bs-toggle=\"collapse\"",
                        "              data-bs-target=\"#" + id + "-2\">",
                        "        Section 2",
                        "      </button>",
                        "    </div>",
                        "    <div id=\"" + id + "-2\" class=\"accordion-collapse collapse\"",
                        "         data-bs-parent=\"#" + id + "\">",
                        "      <div class=\"accordion-body\">",
                        "        Content here.",
                        "      </div>",
                        "    </div>",
                        "  </div>",
                        "</div>",
                        "",
                    ].join("\n");
                },
            },
        ],
    ];

    /* ── Register afterInit extension ─────────────────────────────────────── */

    window.wikmdEditorExtensions = window.wikmdEditorExtensions || [];
    window.wikmdEditorExtensions.push({
        afterInit: function (editor) {
            var container   = editor.codemirror.getWrapperElement().parentElement;
            var mainToolbar = container.querySelector(".editor-toolbar");
            if (!mainToolbar) { return; }

            var row = document.createElement("div");
            row.className = "wikmd-components-toolbar editor-toolbar";

            GROUPS.forEach(function (group, gi) {
                // Vertical separator between groups
                if (gi > 0) {
                    var sep = document.createElement("span");
                    sep.className = "wikmd-ct-sep";
                    row.appendChild(sep);
                }

                group.forEach(function (item) {
                    var btn = document.createElement("button");
                    btn.type      = "button";
                    btn.title     = item.title || "";
                    btn.className = "wikmd-ct-btn";

                    var icon = document.createElement("i");
                    icon.className = item.icon + (item.color ? " " + item.color : "");
                    btn.appendChild(icon);

                    if (item.label) {
                        var lbl = document.createElement("span");
                        lbl.textContent = item.label;
                        btn.appendChild(lbl);
                    }

                    btn.addEventListener("click", function () {
                        editor.codemirror.focus();
                        var snippet = typeof item.snippet === "function"
                            ? item.snippet()
                            : (item.snippet || "");
                        editor.codemirror.getDoc().replaceSelection(snippet);
                    });

                    row.appendChild(btn);
                });
            });

            // Insert the second row directly below the main toolbar
            mainToolbar.insertAdjacentElement("afterend", row);
        },
    });

}());
