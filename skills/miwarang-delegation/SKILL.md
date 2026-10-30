---
name: miwarang-delegation
description: "Route OMO category and agent delegation through Miwarang instead of native task. Use when delegating to an OMO category or agent, choosing foreground or background execution, handling fallback backends, or waiting for or cancelling delegated work."
license: MIT
metadata:
  author: itokun99
  version: "0.2.0"
---

# Miwarang Delegation

Miwarang is the routing authority for OMO delegation. When this skill is
active, use the Miwarang tools for configured category and agent targets
instead of the native `task` tool. Treat the route configuration as the
source of truth for backend and model selection.

## Fast path

For every delegation:

1. Normalize the target to `category:<name>` or `agent:<name>`.
2. Keep the complete target prefix and preserve the original prompt.
3. Omit `backend` and `model` unless the caller explicitly requires an
   intentional override.
4. Set `mode: "background"` only when the caller requests asynchronous work.
5. Pass `cwd` when the delegated work must happen in a specific project.
6. Call `miwarang_delegate`.
7. For background work, save the returned `runId` or `sessionId` and use
   `miwarang_wait` or `miwarang_cancel`.

Do not add an extra user-facing explanation before delegating. The delegation
tool call is the routing action.

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
For the full parameter contract, read
`references/parameter-contract.md`.

## Delegation parameter contract

Use only the following parameters:

| Parameter | Required | Rule |
| --- | --- | --- |
| `target` | yes | Full `category:<name>` or `agent:<name>` string. |
| `prompt` | yes | Original task plus constraints and acceptance criteria. |
| `mode` | no | `"foreground"` by default or `"background"`. |
| `backend` | no | Omit for normal routing and configured fallback selection. |
| `model` | no | Omit unless a target-harness model is explicitly required. |
| `agent` | no | Pass only when the route or caller needs a specific harness agent. |
| `cwd` | no | Absolute project directory for the delegated work. |

Never pass the OMO model as `model`. Never pass a model ID from one harness
when forcing a different harness with `backend`. If an explicit backend is
necessary, it must have a compatible model list in the route or its matching
fallback.

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

Foreground result details normally include:

- `backend`: the backend that actually ran the task.
- `model`: the model that actually ran the task.
- `target`: the normalized target.
- `resolvedVia`: `exact`, `wildcard`, or `default`.
- `fallback` and `fallbackIndex` when a fallback was used.

Background results include a started message and the backend-specific ID in
`details`. Do not call `miwarang_wait` before a background delegate returns
its ID.

## Fallback behavior

Miwarang resolves routes as exact target, namespace wildcard, then
`defaultRoute`. A route can define ordered `fallbacks`, each with its own
backend and model list.

The normal call is intentionally backend-agnostic:

```json
{
  "target": "category:deep-high",
  "prompt": "Design the system and return a decision-complete plan.",
  "cwd": "/workspace/project"
}
```

Do **not** write this merely to force a fallback:

```json
{
  "backend": "commandcode",
  "target": "category:deep-high"
}
```

Miwarang can match that explicit backend to a configured fallback and use its
own model list, but omitting `backend` is safer because it preserves the
entire route chain and lets the resolver choose the correct harness.

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

Model catalogues are checked inside `miwarang_delegate`; do not ask the
caller to run a separate model-list tool before every delegation. A catalog
error such as `opencode/... unavailable` while using Command Code indicates
that a primary-harness model list was forced onto the wrong backend. Omit the
backend override or use a route with a matching fallback.

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

## Configuration and troubleshooting

Read these references when the route needs more than the fast path:

- `references/configuration.md` for a complete backend/route template and
  validation rules.
- `references/lifecycle-and-troubleshooting.md` for result shapes, common
  errors, and recovery decisions.
