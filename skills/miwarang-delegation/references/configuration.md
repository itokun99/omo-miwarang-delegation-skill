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
validate configured model IDs and recognize `:free` or `-free` models. A probe
failure falls back to the configured candidates; it does not authorize an
arbitrary model.

## Route definitions

An OpenCode route can define a harness-specific fallback:

```json
{
  "routes": {
    "category:deep-high": {
      "backend": "opencode",
      "models": [
        "opencode/deepseek-v4.1-flash-free",
        "opencode/nemotron-3-ultra-free",
        "opencode/big-pickle"
      ],
      "freeOnly": true,
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

1. Keep model IDs in the namespace of their backend.
2. Keep free IDs before paid low-cost IDs.
3. Do not set `freeOnly` on a mixed fallback list.
4. Do not use a primary OpenCode `models` list for a Command Code override.
5. Use exact routes for important targets; use `category:*` or `agent:*` for
   intentional namespace defaults.
6. Use `defaultRoute` only when an explicit catch-all is intended.

## Route resolution

Target route resolution is:

1. Exact target, such as `agent:plan-reviewer`.
2. Namespace wildcard, such as `agent:*`.
3. `defaultRoute`.

Within a selected route, model candidates are checked against the selected
backend's live catalogue in order. When `backend` explicitly matches a
configured fallback, Miwarang uses that fallback's model list and disables
further route fallback for that call.

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
