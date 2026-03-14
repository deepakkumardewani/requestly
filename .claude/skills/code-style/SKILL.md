---
name: code-style
description: >
  Use this skill for naming conventions and code style rules. Covers PascalCase,
  camelCase, kebab-case, ALL_CAPS conventions for components, files, variables,
  functions, constants, and TypeScript-specific patterns.
---

# Code Style

## Naming Conventions

| Entity                               | Convention      | Example                                   |
| ------------------------------------ | --------------- | ----------------------------------------- |
| Components, interfaces, type aliases | PascalCase      | `UserProfile`, `ApiResponse`              |
| Variables, functions, methods        | camelCase       | `getUserData`, `isLoading`                |
| Private class members                | Prefix with `_` | `_privateMethod`                          |
| Constants                            | ALL_CAPS        | `MAX_RETRY_COUNT`                         |
| File names                           | kebab-case      | `user-profile.tsx`, `use-company-data.ts` |

## File Naming Rules

| File type  | Convention           | Example                              |
| ---------- | -------------------- | ------------------------------------ |
| Components | `kebab-case.tsx`     | `company-details.tsx`                |
| Hooks      | `use-kebab-case.ts`  | `use-company-details.ts`             |
| Actions    | `actions.ts`         | always this name, per feature folder |
| Types      | `types.ts`           | always this name, per feature folder |
| Helpers    | `helpers.ts`         | always this name, per feature folder |
| Tests      | `kebab-case.spec.ts` | `company-details.spec.ts`            |

## TypeScript Conventions

- Use `interface` for object shapes and component props
- Use `type` for unions, intersections, and `z.infer<>` exports
- Never use `any` or `unknown`

## Related References

- `.claude/skills/typescript-best-practices/SKILL.md` — full TypeScript patterns
