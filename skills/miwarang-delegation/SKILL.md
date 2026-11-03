---
name: miwarang-delegation
description: "Route OMO category and agent delegation through Miwarang instead of native task. Use when delegating to an OMO category or agent, choosing foreground or background execution, handling fallback backends, or waiting for or cancelling delegated work."
license: MIT
metadata:
  author: itokun99
  version: "0.2.3"
---

# Miwarang Delegation

Miwarang is the routing authority for OMO delegation. When this skill is
active, use the Miwarang tools for configured category and agent targets
instead of the native `task` tool. Treat the route configuration as the
source of truth for backend and, on command routes, ordered model candidates.
OpenCode uses its harness-configured default model.

## Fast path

For every delegation:

1. Normalize the target to `category:<name>` or `agent:<name>`.
2. Keep the complete target prefix and preserve the original prompt.
3. Treat `omo.jsonc` as intent-only. A normal call sends only `target` and
   `prompt`, plus `mode` or `cwd` when needed. Never send `backend`, `model`,
   or `agent` in normal routing. Put an OMO `agent:<name>` only in `target`.
   Miwarang resolves the harness; OpenCode supplies its configured default
   model, while command routes use configured candidate order and probe that
   backend's catalogue only when configured.
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

For example, route `agent:explore` with `target: "agent:explore"` only. Do not
add `agent: "explore"` or guess a `backend` value; let Miwarang resolve both.

Do not wait for the user to mention Miwarang. If a delegation target has a
Miwarang route, route it through `miwarang_delegate` immediately. Preserve:

- The complete target prefix, such as `agent:plan-reviewer`.
- The original task prompt without dropping constraints or acceptance criteria.
- The working directory through `cwd` when it is known.
- Foreground/background intent through `mode`.
- The complete OMO target. An `agent:<name>` target selects a Miwarang route;
  it is not a harness-agent override.

Do not forward the OMO session's own model name or any model/backend value
copied from `omo.jsonc`. OMO configuration supplies intent and category only.
Omit `model` and `backend` unless the user explicitly requires an intentional
target-harness override.
OpenCode always uses the `orchestrator` agent and rejects `model` and `agent`
overrides. Command Code defaults to `General`; the example enables its
`agent` and `agent_output` tools so it can delegate to agents registered in
that Command Code installation.
Do not pass an OMO target name through the `agent` parameter.
For the full parameter contract, read
`references/parameter-contract.md`.

## Delegation parameter contract

Use only the following parameters:

| Parameter | Required | Rule |
| --- | --- | --- |
| `target` | yes | Full `category:<name>` or `agent:<name>` string. |
| `prompt` | yes | Original task plus constraints and acceptance criteria. |
| `mode` | no | `"foreground"` by default or `"background"`. |
| `backend` | no | Omit normally. Only use an exact key from the configured `backends` when the user explicitly requires an override. |
| `model` | no | Omit normally. Use only for an intentional command-backend override confirmed by that backend's catalogue; OpenCode rejects it. |
| `agent` | no | Omit normally. Only use when explicitly required and command args support `{{agent}}`; OMO `agent:<name>` belongs in `target`, and OpenCode always uses `orchestrator`. |
| `cwd` | no | Absolute project directory for the delegated work. |

Never pass the OMO model as `model`. Never pass a model ID from one harness
when forcing a different harness with `backend`. If an explicit override is
necessary, verify that it is an intentional user requirement. A command
backend model override must be supported by that backend; OpenCode rejects
`model` and `agent` overrides. Otherwise omit both overrides and let Miwarang
resolve the configured route.

## OMO configuration is intent-only

`omo.jsonc` supplies intent/category and policy context. It does not provide
target-harness model selection. Never copy its model or backend into
`miwarang_delegate`; the parent OMO model may belong to neither OpenCode nor
Command Code.

The correct handoff is:

```json
{
  "target": "category:deep-high",
  "prompt": "Investigate the architecture and return a decision-complete plan.",
  "cwd": "/workspace/project"
}
```

OpenCode sessions omit `model`, use `orchestrator`, and do not query the
OpenCode model catalogue. Command backends use configured `models` in order;
Miwarang probes that backend's live catalogue only when `listModelsArgv` is
configured. A separate model-list call is not required for normal routing.

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
- `model`: the selected model for command backends. OpenCode's harness-selected
  default is not reported as a Miwarang model.
- `target`: the normalized target.
- `resolvedVia`: `exact`, `wildcard`, or `default`.
- `fallback` and `fallbackIndex` when a fallback was used.

Background results include a started message and the backend-specific ID in
`details`. Do not call `miwarang_wait` before a background delegate returns
its ID.

## Fallback behavior

Miwarang resolves routes as exact target, namespace wildcard, then
`defaultRoute`. Only command backends have Miwarang-selected model candidates:
their `models` list is tried in order and checked against the Command Code
catalogue when `listModelsArgv` is configured. OpenCode routes omit `models`;
the OpenCode harness supplies the model and Miwarang always selects
`orchestrator`.

A route can define ordered backend `fallbacks`, each with its own backend and,
for command backends, candidate list. Legacy `freeOnly` fields do not filter
models; candidate order, not catalog cost, determines command-model priority.

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

Keep free candidates before low-cost fallback candidates. Do not add arbitrary
premium models to a fallback list. Miwarang does not apply a free-only or
cost-based filter, so the configured candidate order controls which command
model is tried first.

Foreground command runs can continue through configured candidates and
backend fallbacks for quota, rate-limit, credit, five-hour, weekly-limit, or
HTTP 429 errors. Recognized OpenCode provider failures can advance only to a
configured backend fallback; they are never retried against a Miwarang model
list.
Explicit `model` or `backend` overrides disable the remaining fallback chain.
Background start failures can use the configured chain until a
`runId`/`sessionId` exists. Once an ID exists, runtime failures are reported
through `miwarang_wait` rather than retried silently.

Miwarang does not create child OMO or DAG watcher processes. The main agent
owns the lifecycle: start as many background delegations as needed, retain
each returned identifier, then wait or cancel each one directly.

Command model catalogues are checked inside `miwarang_delegate` when a
command backend has a configured probe; do not ask the caller to run a
separate model-list tool before every delegation. The agent does not need to
invent or preselect a model. If a Command Code route reports that a configured
candidate is absent from its catalogue, correct the Command Code route list.
OpenCode does not use a model catalogue for session selection. If an OpenCode
call rejects `model` or `agent`, omit those overrides and retry the same
intent target.

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
