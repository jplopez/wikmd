/**
 * wikmd Bootstrap Components toolbar extension
 *
 * Adds a "Bootstrap Components" dropdown button to the EasyMDE toolbar.
 * Each item inserts a ready-to-use Bootstrap 5 template using Pandoc's
 * fenced-div (:::) syntax — which wikmd passes through to HTML as-is.
 *
 * ── Adding your own components ──────────────────────────────────────────────
 * Edit the COMPONENTS array below.  Each item is either:
 *
 *   Section header  { label: "Heading text", separator: true }
 *   Plain divider   { separator: true }
 *
 *   Component       {
 *                     label:   "Human readable name",
 *                     snippet: "markdown string"          // string OR function() → string
 *                   }
 *
 * snippet functions are called at insertion time, so you can generate
 * unique IDs:  snippet: function() { return "id-" + Date.now().toString(36); }
 *
 * ── Fenced-div primer ───────────────────────────────────────────────────────
 * Pandoc converts  ::: {.alert .alert-info role="alert"}  to
 *                  <div class="alert alert-info" role="alert">
 * Bootstrap reads the classes, so the component renders correctly.
 * Nested divs need one extra colon per level (:::: outer / ::: inner).
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
    "use strict";

    /* ── Bootstrap 5 component snippets ──────────────────────────────────── */

    var COMPONENTS = [

        // ── Alerts ──────────────────────────────────────────────────────────
        {
            label: "Alerts",
            children: [
                {
                    label:   "Info",
                    snippet: "\n::: {.alert .alert-info role=\"alert\"}\n**Note:** Your message here.\n:::\n",
                },
                {
                    label:   "Success",
                    snippet: "\n::: {.alert .alert-success role=\"alert\"}\n**Success:** Your message here.\n:::\n",
                },
                {
                    label:   "Warning",
                    snippet: "\n::: {.alert .alert-warning role=\"alert\"}\n**Warning:** Your message here.\n:::\n",
                },
                {
                    label:   "Danger",
                    snippet: "\n::: {.alert .alert-danger role=\"alert\"}\n**Danger:** Your message here.\n:::\n",
                },
            ],
        },

        // ── Cards ────────────────────────────────────────────────────────────
        {
            label: "Cards",
            children: [
                {
                    label:   "Card",
                    snippet: "\n:::: card\n::: card-body\n**Card Title**\n\nCard content goes here.\n:::\n::::\n",
                },
                {
                    label:   "Card with header & footer",
                    snippet: "\n::::: card\n::: card-header\nHeader\n:::\n::: card-body\n**Title**\n\nBody content.\n:::\n::: card-footer\nFooter\n:::\n:::::\n",
                },
            ],
        },

        // ── Grid layout ──────────────────────────────────────────────────────
        {
            label: "Grid Layout",
            children: [
                {
                    label:   "2 Columns (50 / 50)",
                    snippet: "\n:::: row\n::: col-md-6\nLeft column.\n:::\n\n::: col-md-6\nRight column.\n:::\n::::\n",
                },
                {
                    label:   "3 Columns (33 / 33 / 33)",
                    snippet: "\n::::: row\n::: col-md-4\nColumn 1.\n:::\n\n::: col-md-4\nColumn 2.\n:::\n\n::: col-md-4\nColumn 3.\n:::\n:::::\n",
                },
                {
                    label:   "Sidebar (25 / 75)",
                    snippet: "\n:::: row\n::: col-md-3\nSidebar.\n:::\n\n::: col-md-9\nMain content.\n:::\n::::\n",
                },
            ],
        },

        // ── Callouts ─────────────────────────────────────────────────────────
        {
            label: "Callouts",
            children: [
                {
                    label:   "Note",
                    snippet: "\n::: {.callout .border-start .border-info .border-3 .ps-3}\n**Note:** Content here.\n:::\n",
                },
                {
                    label:   "Tip",
                    snippet: "\n::: {.callout .border-start .border-success .border-3 .ps-3}\n**Tip:** Content here.\n:::\n",
                },
                {
                    label:   "Important",
                    snippet: "\n::: {.callout .border-start .border-warning .border-3 .ps-3}\n**Important:** Content here.\n:::\n",
                },
            ],
        },

        // ── Accordion (needs unique IDs — generated at insert time) ──────────
        {
            label: "Accordion",
            children: [
                {
                    label: "Accordion",
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
        },
    ];

    /* ── Register toolbar extension ──────────────────────────────────────── */

    window.wikmdEditorExtensions = window.wikmdEditorExtensions || [];
    window.wikmdEditorExtensions.push({
        toolbar: function (items) {
            return items.concat([
                "|",
                wikmdToolbarDropdown({
                    name:      "bootstrap-components",
                    title:     "Bootstrap Components",
                    className: "bi bi-layout-text-window-reverse",
                    items:     COMPONENTS,
                }),
            ]);
        },
    });

}());
