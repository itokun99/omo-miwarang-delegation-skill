# Miwarang parameter contract

Use this reference when a delegation needs explicit parameters.

## Intent-only rule

`omo.jsonc` supplies the intent/category and policy context. It does not
provide a target-harness model selection. Never copy its model or backend into
`miwarang_delegate`. Omit both fields and let Miwarang resolve the configured
route and fallback chain. OpenCode uses its harness-configured model and
`orchestrator` agent without a model-catalogue query. Command routes use their
ordered `models` candidates and check the Command Code catalogue only when
`listModelsArgv` is configured.

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
| `backend` | Only when the user explicitly requires an override and the value exactly matches a configured `backends` key. A matching fallback disables further fallbacks for the call. | Normal routing or when you only want the route's fallback; omit it. |
| `model` | Only when the user explicitly pins a supported command-backend model. | Normal routing, an OMO session model, or any OpenCode target. OpenCode rejects model overrides. |
| `agent` | Only when the user explicitly requires a command-agent override and its args use `{{agent}}`. | Normal routing, an OMO `agent:<name>` target, or any OpenCode target. OpenCode always uses `orchestrator`. |
| `cwd` | The work must inspect or edit a specific project. | The current `ctx.cwd` is already the intended project. |

For a normal call to `agent:explore`, put `agent:explore` in `target` only.
Do not add `agent` or `backend` parameters.

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
