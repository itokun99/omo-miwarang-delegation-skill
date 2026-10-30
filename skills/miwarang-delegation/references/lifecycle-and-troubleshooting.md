# Lifecycle and troubleshooting

## Foreground lifecycle

Foreground execution returns only after the backend returns text:

```text
miwarang_delegate -> model selection -> backend execution -> final text
```

The result details identify the actual backend and model. If `fallback: true`
is present, inspect `fallbackIndex` and `model` rather than assuming the
primary route ran.

## Background lifecycle

Background execution returns before the task completes:

```text
miwarang_delegate(mode=background)
  -> runId/sessionId
  -> miwarang_wait({runId|sessionId})
  -> final text or terminal error
```

Use `runId` for a command backend and `sessionId` for OpenCode. The
`miwarang_wait` tool can resolve a command backend from its persisted RunStore
record. Do not create a second delegation just because the first background
call has not completed.

Use `miwarang_cancel` with the same identifier when the caller asks to stop
the run. Cancellation is asynchronous for command processes and may first
return a `cancelling` state.

If a backend fails while creating the session or before returning an ID,
Miwarang can continue through the configured fallback chain. Once a
`runId`/`sessionId` exists, Miwarang does not silently start a second task;
inspect the terminal result with `miwarang_wait`.

There is no DAG watcher or child OMO process for a Miwarang background run.
The parent agent owns the returned IDs and should wait for multiple runs
directly rather than creating a separate watcher delegation.

## Error decision table

| Error | Meaning | Action |
| --- | --- | --- |
| `No route configured for ...` | Target has no exact, wildcard, or default route. | Stop and report missing config; do not invent a backend. |
| `No available free model ...` | A `freeOnly` route has no candidate in its backend catalogue. | Omit `backend` and use configured fallback chain, or fix route models. |
| `opencode/... unavailable` with Command Code catalog | OpenCode model IDs were sent to Command Code. | Remove `backend="commandcode"` or add a matching Command Code fallback. |
| `Requested model ... is not in the live model catalog` | Explicit model override is invalid for that backend. | Remove `model` or choose an ID from that backend's live catalogue. |
| `provider.quota`, `402`, or empty OpenCode reply | OpenCode failed at runtime. | Let foreground fallback continue; do not retry background silently. |
| Command `quota`, `rate limit`, `5-hour`, `weekly limit`, `credits`, or `429` | Command backend exhausted a quota or rate limit. | Let foreground model fallback continue to the next configured candidate. |
| `Task state: failed` from `miwarang_wait` | A background process ended unsuccessfully. | Read the returned error and fix config/auth; do not blindly repeat. |

## Common mistakes

### Passing the OMO model

Do not pass the model selected by the parent OMO session. OMO model IDs may
belong to neither OpenCode nor Command Code.

### Forcing a fallback backend

Prefer:

```json
{
  "target": "category:deep-high",
  "prompt": "Investigate the architecture.",
  "cwd": "/workspace/project"
}
```

Avoid:

```json
{
  "backend": "commandcode",
  "target": "category:deep-high",
  "model": "opencode/deepseek-v4.1-flash-free"
}
```

If an explicit backend is required, use a model from that backend's route or
matching fallback, never the primary harness's model ID.

### Forgetting the full target prefix

`category:deep-high` and `agent:plan-reviewer` are valid. `deep-high` and
`plan-reviewer` are not valid Miwarang targets.

### Losing the background identifier

Always retain the exact ID returned by `miwarang_delegate`. Do not infer a
`runId` from a `sessionId` or vice versa.

## Reload after extension changes

The host caches loaded extensions. After changing the Miwarang extension or
its local config, run `/reload` in the active OMO/Senpi session before testing.
