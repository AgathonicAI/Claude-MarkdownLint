# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This repository contains a Claude Code skill that provides markdownlint capabilities - testing markdown files for style/format issues and automatically repairing them.

## Skill Structure

Claude Code skills are markdown files placed in `.claude/skills/` directories. They define reusable capabilities that can be invoked during sessions.

A skill file typically contains:
- YAML frontmatter with `name` and `description` fields
- Instructions for how Claude should perform the task
- Any relevant commands, patterns, or workflows

## markdownlint Integration

The skill should leverage the `markdownlint-cli2` tool:
- **Lint files**: `npx markdownlint-cli2 "**/*.md"`
- **Fix automatically**: `npx markdownlint-cli2 --fix "**/*.md"`
- **Lint specific file**: `npx markdownlint-cli2 path/to/file.md`

Configuration files supported:
- `.markdownlint.jsonc` or `.markdownlint.json` - rule configuration
- `.markdownlint-cli2.jsonc` - CLI-specific options including globs and ignores
