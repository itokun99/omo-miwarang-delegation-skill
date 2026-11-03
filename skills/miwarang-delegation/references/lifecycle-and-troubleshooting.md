# Lifecycle and troubleshooting

## Foreground lifecycle

Foreground execution returns only after the backend returns text:

```text
miwarang_delegate -> route resolution -> backend-specific setup
  -> backend execution -> final text
```

OpenCode uses its harness-configured model and `orchestrator`; Miwarang does
not query its model catalogue. Command backends use configured model
candidates, optionally checked against that backend's catalogue. Result
details include `model` only for command backends. If `fallback: true` is
present, inspect `fallbackIndex` and the selected backend before assuming the
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
Miwarang can continue through the configured backend fallback chain. Command
backends may also try later configured model candidates for recognized quota
or rate-limit errors. Once a `runId`/`sessionId` exists, Miwarang does not
silently start a second task; inspect the terminal result with
`miwarang_wait`.

There is no DAG watcher or child OMO process for a Miwarang background run.
The parent agent owns the returned IDs and should wait for multiple runs
directly rather than creating a separate watcher delegation.

## Error decision table

| Error | Meaning | Action |
| --- | --- | --- |
| `No route configured for ...` | Target has no exact, wildcard, or default route. | Stop and report missing config; do not invent a backend. |
| `Backend ... is not configured` | A manually supplied `backend` value is not a key in the configured `backends` object. | Omit `backend` and retry with the same target and prompt; only use an exact configured key for an explicit user override. |
| `No configured model is available for ...` | No configured command candidate is present in that backend's live catalogue. | Correct the command route's `models` list or use a configured backend fallback. OpenCode does not use this model-selection path. |
| A configured OpenCode model ID is absent from Command Code's catalogue | A Command Code route contains a model ID from another harness. | Replace it with a Command Code candidate; do not copy model IDs across harnesses. |
| `Requested model ... is not in the live model catalog` | An explicit command-backend model override is invalid. | Omit `model` or verify an ID supported by that backend. OpenCode rejects model overrides. |
| OpenCode rejects `model` or `agent` overrides | OpenCode owns its model default and Miwarang selects `orchestrator`. | Omit both parameters. |
| `provider.quota`, `402`, or empty OpenCode reply | OpenCode failed during execution. | Allow a configured backend fallback; do not retry with a Miwarang model list. |
| Command `quota`, `rate limit`, `5-hour`, `weekly limit`, `credits`, or `429` | Command backend exhausted a quota or rate limit. | Allow foreground candidate and backend fallback in configured order. |
| `Task state: failed` from `miwarang_wait` | A background process ended unsuccessfully. | Read the returned error and fix config/auth; do not blindly repeat. |

## Common mistakes

### Passing the OMO model

Do not pass the model selected by the parent OMO session. OMO model IDs may
belong to neither OpenCode nor Command Code.

### Passing `backend` or `agent` in normal calls

Normal calls send `target` and `prompt`, with `mode` or `cwd` only when needed.
For `target: "agent:explore"`, put `agent:explore` in `target` only; do not
send `agent: "explore"` or a guessed `backend`. If you see `Backend ... is not
configured`, remove the `backend` field and retry the same target.

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

If an explicit backend is required, omit `model` unless the caller
intentionally pins a command-backend model supported by that backend. Never
pass the primary harness's model ID to a different backend.

### Forgetting the full target prefix

`category:deep-high` and `agent:plan-reviewer` are valid. `deep-high` and
`plan-reviewer` are not valid Miwarang targets.

### Losing the background identifier

Always retain the exact ID returned by `miwarang_delegate`. Do not infer a
`runId` from a `sessionId` or vice versa.

## Reload after extension changes

The host caches loaded extensions. After changing the Miwarang extension or
its local config, run `/reload` in the active OMO/Senpi session before testing.
