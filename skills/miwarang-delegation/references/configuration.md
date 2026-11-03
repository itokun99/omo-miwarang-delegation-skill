# Miwarang configuration reference

This reference describes the configuration shape the skill expects. The
Miwarang extension reads the user's config from `MIWARANG_CONFIG` or
`~/.config/miwarang/config.json`.

## Backend definitions

OpenCode uses its authenticated API CLI. Command backends use an executable
plus an argument array; prompts must travel through `argument` or `stdin`, not
through a shell string.

```json
{
  "backends": {
    "opencode": {
      "type": "opencode-v2",
      "command": "opencode"
    },
    "commandcode": {
      "type": "command",
      "command": "commandcode",
      "args": [
        "-p",
        "--model",
        "{{model}}",
        "--no-session",
        "--yolo",
        "--tools-enable",
        "agent,agent_output",
        "-t"
      ],
      "promptInput": "argument",
      "timeoutMs": 900000,
      "listModelsArgv": ["--list-models"]
    }
  }
}
```

`listModelsArgv` enables the Command Code catalogue probe. It lets Miwarang
validate configured candidate IDs. `:free` and `-free` IDs may be marked
zero-cost in catalog metadata, but Miwarang does not filter candidates by
cost. A failed probe uses the route's configured candidates for normal
routing; it does not introduce a model outside that list.

## Route definitions

An OpenCode route can define a harness-specific fallback:

```json
{
  "routes": {
    "category:deep-high": {
      "backend": "opencode",
      "fallbacks": [
        {
          "backend": "commandcode",
          "models": [
            "reflection/beam:free",
            "poolside/laguna-s-2.1-free",
            "stealth/glyph-cluster:free",
            "deepseek/deepseek-v4-flash",
            "qwen/qwen3.8-flash",
            "qwen/qwen3.7-flash"
          ]
        }
      ]
    }
  }
}
```

Rules:

1. OpenCode routes omit `models`; OpenCode uses its configured default model
   and Miwarang selects the `orchestrator` agent.
2. Command routes keep candidate IDs in that backend's namespace and order
   free IDs before the configured low-cost fallback models.
3. Miwarang does not filter candidates by `freeOnly` or catalog cost; legacy
   `freeOnly` fields do not enforce a price gate.
4. Do not use a primary OpenCode model ID for a Command Code route.
5. Use exact routes for important targets; use `category:*` or `agent:*` for
   intentional namespace defaults.
6. Use `defaultRoute` only when an explicit catch-all is intended.

## Route resolution

Target route resolution is:

1. Exact target, such as `agent:plan-reviewer`.
2. Namespace wildcard, such as `agent:*`.
3. `defaultRoute`.

Within a command route, model candidates are checked against its live
catalogue in order when `listModelsArgv` is configured. OpenCode model
selection stays inside the harness and does not query its catalogue.
When `backend` explicitly matches a configured fallback, Miwarang uses that
fallback route and disables further route fallback for that call.

## Blocking native delegation

`blockNativeTask` controls whether native OMO `task` calls are intercepted.
Keep the policy explicit in shared configurations. A block reason should
redirect the parent agent to `miwarang_delegate` with the same target and
prompt.

## Do not commit

Never put these in the config repository or skill repository:

- API keys or auth JSON.
- Local run stores.
- Personal project paths that reveal private repositories.
- User-specific model credentials.
