# Markdownlint Rules Reference

Comprehensive guide to common markdownlint rules, what they catch, and how to fix violations.

## Heading Rules

### MD001 - heading-increment

**What it catches:** Heading levels that skip (e.g., h1 to h3).

**Why it matters:** Proper heading hierarchy improves accessibility and document structure.

**Auto-fixable:** No

**Fix strategy:**
- Adjust the heading level to increment by exactly one
- Consider if document structure needs reorganization

**Example violation:**
```markdown
# Main Title
### This skips h2  <!-- MD001 violation -->
```

**Fixed:**
```markdown
# Main Title
## This is now h2  <!-- Fixed -->
```

---

### MD003 - heading-style

**What it catches:** Inconsistent heading styles (ATX `#` vs Setext underlines).

**Why it matters:** Consistency improves readability.

**Auto-fixable:** Yes (usually)

**Fix strategy:** Convert all headings to ATX style (`#`, `##`, etc.)

---

### MD022 - blanks-around-headings

**What it catches:** Headings without blank lines before/after.

**Why it matters:** Improves visual separation and parsing.

**Auto-fixable:** Yes

**Manual fix:** Add blank line before and after the heading.

---

### MD024 - no-duplicate-heading

**What it catches:** Multiple headings with identical text.

**Why it matters:** Duplicate headings confuse navigation and linking.

**Auto-fixable:** No

**Fix strategy:**
- Make each heading unique by adding context
- Common patterns:
  - "Setup" → "Database Setup", "Environment Setup"
  - "Usage" → "Basic Usage", "Advanced Usage"
  - "Example" → "Example: Authentication", "Example: File Upload"

---

### MD025 - single-title

**What it catches:** Multiple h1 headings in a document.

**Why it matters:** Documents should have one top-level title.

**Auto-fixable:** No

**Fix strategy:**
- Keep only one h1 (usually at the top)
- Demote other h1s to h2

---

### MD041 - first-line-heading

**What it catches:** Document doesn't start with a heading.

**Why it matters:** Documents should have a clear title.

**Auto-fixable:** No

**Fix strategy:**
- Add an h1 heading at the start
- Or disable this rule if frontmatter/other content is intentional

**Note:** Often disabled in starter configs as many valid documents don't need this.

## List Rules

### MD004 - ul-style

**What it catches:** Inconsistent unordered list markers (*, -, +).

**Why it matters:** Consistency improves readability.

**Auto-fixable:** Yes

**If manual fix needed:** Standardize on one marker (typically `-` or `*`).

---

### MD005 - list-indent

**What it catches:** Inconsistent list indentation.

**Why it matters:** Proper indentation ensures correct nesting.

**Auto-fixable:** Yes

**If manual fix needed:** Use consistent indentation (typically 2 or 4 spaces).

---

### MD007 - ul-indent

**What it catches:** Unordered list indentation issues.

**Why it matters:** Consistent indentation for nested lists.

**Auto-fixable:** Yes

---

### MD030 - list-marker-space

**What it catches:** Spaces after list markers.

**Why it matters:** Consistency in list formatting.

**Auto-fixable:** Yes

## Code Rules

### MD031 - blanks-around-fences

**What it catches:** Fenced code blocks without surrounding blank lines.

**Why it matters:** Ensures code blocks render correctly.

**Auto-fixable:** Yes

**Manual fix:** Add blank line before and after the code fence.

---

### MD040 - fenced-code-language

**What it catches:** Fenced code blocks without a language identifier.

**Why it matters:** Enables syntax highlighting.

**Auto-fixable:** No

**Fix strategy:**
- Add appropriate language identifier
- Common languages: `javascript`, `typescript`, `python`, `bash`, `json`, `yaml`, `markdown`
- Use `text` or `plaintext` for plain text

**Example:**
```markdown
\`\`\`
code without language
\`\`\`
```

Fixed:
```markdown
\`\`\`javascript
code with language
\`\`\`
```

---

### MD046 - code-block-style

**What it catches:** Inconsistent code block style (fenced vs indented).

**Why it matters:** Consistency.

**Auto-fixable:** No

**Fix strategy:** Convert all to fenced style (preferred for clarity).

## Link Rules

### MD042 - no-empty-links

**What it catches:** Links with empty URLs `[text]()`.

**Why it matters:** Empty links are broken/useless.

**Auto-fixable:** No

**Fix strategy:**
1. Add the intended URL
2. Or remove the link markup entirely
3. Or mark as TODO: `[text](#TODO)`

---

### MD052 - reference-links-images

**What it catches:** Reference-style links/images with missing definitions.

**Why it matters:** Broken references cause rendering issues.

**Auto-fixable:** No

**Fix strategy:**
- Add the missing reference definition at the bottom of the document
- Or convert to inline link style

**Example violation:**
```markdown
See [the docs][docs] for more.
<!-- Missing: [docs]: https://... -->
```

**Fixed:**
```markdown
See [the docs][docs] for more.

[docs]: https://example.com/docs
```

## Whitespace Rules

### MD009 - no-trailing-spaces

**What it catches:** Trailing whitespace at end of lines.

**Why it matters:** Unnecessary whitespace, can cause diff noise.

**Auto-fixable:** Yes

---

### MD010 - no-hard-tabs

**What it catches:** Hard tab characters.

**Why it matters:** Tabs render inconsistently.

**Auto-fixable:** Yes

---

### MD012 - no-multiple-blanks

**What it catches:** Multiple consecutive blank lines.

**Why it matters:** Unnecessary whitespace.

**Auto-fixable:** Yes

**Default:** Maximum 1 blank line.

---

### MD047 - single-trailing-newline

**What it catches:** File doesn't end with exactly one newline.

**Why it matters:** POSIX compliance, consistent file endings.

**Auto-fixable:** Yes

**Manual fix:** Ensure file ends with `\n` but not `\n\n`.

## Line Rules

### MD013 - line-length

**What it catches:** Lines exceeding maximum length (default: 80 chars).

**Why it matters:** Readability in terminals/editors.

**Auto-fixable:** No

**Fix strategy:**
- Break long lines at natural points
- For prose: break at sentence boundaries
- For code: consider if line really needs to be that long

**Note:** Often disabled in configs as it's impractical for many use cases.

## Inline Rules

### MD033 - no-inline-html

**What it catches:** Raw HTML in markdown.

**Why it matters:** Pure markdown is more portable.

**Auto-fixable:** No

**Fix strategy:**
- Convert to markdown equivalent if possible
- Or disable rule if HTML is intentional (badges, details tags, etc.)

**Note:** Often disabled in configs for practical use.

---

### MD049 - emphasis-style

**What it catches:** Inconsistent emphasis markers (* vs _).

**Why it matters:** Consistency.

**Auto-fixable:** Yes

---

### MD050 - strong-style

**What it catches:** Inconsistent strong markers (** vs __).

**Why it matters:** Consistency.

**Auto-fixable:** Yes

## Rules Commonly Disabled

These rules are often disabled in practical configs:

| Rule | Why Often Disabled |
|------|-------------------|
| MD013 | Line length limits impractical for prose |
| MD033 | Inline HTML needed for badges, details, etc. |
| MD041 | Not all docs need h1 first line |

## Fix Priority

When multiple issues exist, fix in this order:

1. **Structure issues** (MD001, MD025) - affects document hierarchy
2. **Content issues** (MD024, MD042) - affects meaning/links
3. **Formatting issues** (MD022, MD031) - affects rendering
4. **Style issues** (MD003, MD004) - affects consistency
5. **Whitespace issues** (MD009, MD012, MD047) - minor cleanup

## Rule Configuration

Rules can be configured in `.markdownlint.jsonc`:

```jsonc
{
  // Disable a rule entirely
  "MD013": false,

  // Configure rule options
  "MD012": { "maximum": 2 },

  // Enable all by default
  "default": true
}
```

Common configurations:
- `false` - disable rule
- `true` - enable with defaults
- `{ options }` - enable with custom options

## Inline Disabling

Disable rules for specific content:

```markdown
<!-- markdownlint-disable MD033 -->
<details>
  <summary>Click to expand</summary>
  Content here
</details>
<!-- markdownlint-enable MD033 -->
```

Or for single line:
```markdown
<!-- markdownlint-disable-next-line MD013 -->
This is a very long line that would normally violate the line length rule but is allowed here.
```

Use sparingly - prefer fixing issues or adjusting config over inline disabling.
