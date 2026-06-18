# Agent Instructions

## General Rules

- Read this file before making changes in this repository.
- This is a pnpm + Turborepo monorepo. Prefer `pnpm` and the root `turbo` scripts in `package.json`.
- Keep changes focused and minimal. Do not touch unrelated files.
- Use `apply_patch` for manual edits.
- Do not use destructive commands such as `git reset --hard` or `git checkout --` unless explicitly asked.
- If you need to verify behavior, prefer the smallest relevant test or typecheck command from the root scripts.
- Before finishing, review the diff for accidental changes.

## Code Standards

- Follow the existing code style in nearby files. Add comments only when they clarify non-obvious intent.
- Prefer theme tokens and existing color variables for UI styling. If hardcoding a color seems materially better, stop and get explicit user consent before doing it.
- UI text should come from the i18n files. Do not hardcode user-facing copy inline unless the user explicitly asks for an exception.
