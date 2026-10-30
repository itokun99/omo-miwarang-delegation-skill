# Miwarang parameter contract

Use this reference when a delegation needs explicit parameters.

## Intent-only rule

`omo.jsonc` supplies the intent/category and policy context. It does not
provide a target-harness model selection. Never copy its model or backend into
`miwarang_delegate`. Omit both fields and let Miwarang query the selected
harness's live catalogue and apply the configured fallback chain.

## Required values

### `target`

Use the full OMO target:

- `category:quick`
- `category:deep-high`
- `agent:explore`
- `agent:plan-reviewer`

Do not pass only `deep-high`, `plan-reviewer`, or the native task's unprefixed
category value.

### `prompt`

Preserve the complete task prompt. Include:

- The requested deliverable.
- Constraints and forbidden actions.
- Relevant paths or scope.
- Acceptance criteria.
- Whether the delegate should report findings, edit files, or only inspect.

Do not add credentials or private auth material to the prompt.

## Optional values

| Field | Use it when | Avoid it when |
| --- | --- | --- |
| `mode` | The caller explicitly requests background execution. | The result is needed before continuing. |
| `backend` | You intentionally need a configured alternate backend and its model list is compatible. | You only want the route's fallback. Omit it. |
| `model` | The caller explicitly pins a model that exists in the selected backend's live catalogue. | The OMO session model is merely available. |
| `agent` | A command/backend route requires a harness agent name. | The route already supplies the correct agent. |
| `cwd` | The work must inspect or edit a specific project. | The current `ctx.cwd` is already the intended project. |

## Safe foreground example

```json
{
  "target": "agent:plan-reviewer",
  "prompt": "Review the plan for missing acceptance criteria. Do not edit files. Return findings grouped by severity.",
  "mode": "foreground",
  "cwd": "/Users/aleph/Projects/example"
}
```

## Safe background example

```json
{
  "target": "category:deep-high",
  "prompt": "Investigate the architecture and return a decision-complete design.",
  "mode": "background",
  "cwd": "/Users/aleph/Projects/example"
}
```

Save the returned `runId` or `sessionId` before doing anything else.
