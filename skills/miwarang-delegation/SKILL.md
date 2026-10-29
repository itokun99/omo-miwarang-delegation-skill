---
name: miwarang-delegation
description: "Route OMO category and agent delegation through Miwarang instead of native task. Use when delegating to an OMO category or agent, choosing foreground or background execution, handling fallback backends, or waiting for or cancelling delegated work."
license: MIT
metadata:
  author: itokun99
  version: "0.1.0"
---

# Miwarang Delegation

Miwarang is the routing authority for OMO delegation. When this skill is
active, use the Miwarang tools for configured category and agent targets
instead of the native `task` tool.

## Route every delegation

Use `miwarang_delegate` for these target forms:

- Categories: `category:quick`, `category:unspecified-low`,
  `category:unspecified-high`, `category:deep-low`, `category:deep-high`,
  `category:ultrabrain`, `category:artistry`, `category:architect`,
  `category:writing`, and `category:visual-engineering`.
- Agents: `agent:explore`, `agent:librarian`, `agent:plan-consultant`,
  `agent:plan-reviewer`, `agent:omo-native-code-reviewer`,
  `agent:omo-native-gate-reviewer`, and `agent:omo-native-qa-executor`.
- Any additional `category:<name>` or `agent:<name>` target with a matching
  Miwarang route.

Do not wait for the user to mention Miwarang. If a delegation target has a
Miwarang route, route it through `miwarang_delegate` immediately. Preserve:

- The complete target prefix, such as `agent:plan-reviewer`.
- The original task prompt without dropping constraints or acceptance criteria.
- The working directory through `cwd` when it is known.
- Foreground/background intent through `mode`.
- The configured agent name when the route or caller requires it.

Do not forward the OMO session's own model name or a model from `omo.jsonc`.
Omit `model` unless the caller explicitly requires a target-harness model.

## Foreground and background work

Use foreground mode by default:

```json
{
  "target": "agent:plan-reviewer",
  "prompt": "Review the implementation plan for missing acceptance criteria.",
  "mode": "foreground"
}
```

When the caller requests background execution, use `mode: "background"` and
immediately preserve the returned `runId` or `sessionId`. Use:

- `miwarang_wait` to retrieve a background result.
- `miwarang_cancel` to stop a background run.

Command backends return `runId`; OpenCode returns `sessionId`. Do not replace
one identifier type with the other.

## Fallback behavior

Miwarang resolves routes as exact target, namespace wildcard, then
`defaultRoute`. A route can define ordered `fallbacks`, each with its own
backend and model list.

The recommended Command Code chain is:

1. `reflection/beam:free`
2. `poolside/laguna-s-2.1-free`
3. `stealth/glyph-cluster:free`
4. `deepseek/deepseek-v4-flash`
5. `qwen/qwen3.8-flash`
6. `qwen/qwen3.7-flash`

Keep free candidates before paid low-cost candidates. Do not add arbitrary
premium models to a fallback list. A mixed free/paid list must not set
`freeOnly`, because that would reject the paid candidates.

Foreground runs can continue through configured model and backend fallbacks
when the provider reports quota, rate-limit, credit, five-hour, weekly-limit,
or HTTP 429 errors. Explicit `model` or `backend` overrides disable fallback.
Background runtime failures are reported through `miwarang_wait` rather than
retried silently.

## Native task boundary

Do not call native `task` for a target covered by Miwarang. If the host blocks
the native call, follow the block reason and call `miwarang_delegate` with the
same target and prompt. If the Miwarang tools are unavailable, report that
routing failure instead of silently switching to an unrelated backend.

## Safe delegation

Never put credentials, API keys, or private configuration values in the
delegated prompt. Keep secrets in the target harness's own authenticated
configuration. Use a dedicated worktree when delegating edits to an external
or high-risk harness.
