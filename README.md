# Miwarang Delegation Skill v0.2.0

An Agent Skill that makes Miwarang the default routing layer for OMO category
and agent delegation.

The skill is deliberately operational: it tells an agent exactly which
parameters to pass, when to omit backend/model overrides, how to preserve
background IDs, and how to diagnose cross-harness model errors.

## Install

Install the skill from GitHub with the skills CLI:

```bash
npx skills add itokun99/omo-miwarang-delegation-skill --skill miwarang-delegation
```

Choose the agent targets that should receive the skill when the CLI prompts.
The repository is also discoverable through [skills.sh](https://skills.sh)
after it is public and installed by users.

## What it does

- Routes configured OMO categories and agents through `miwarang_delegate`.
- Preserves prompts, targets, working directories, and foreground/background
  intent.
- Uses `miwarang_wait` and `miwarang_cancel` for background lifecycle control.
- Keeps fallback routing explicit and ordered.
- Documents the recommended Command Code chain: free models first, then
  low-cost models.
- Prevents accidental forwarding of the parent OMO session's model name.
- Handles backend-specific model lists when an explicit backend override
  matches a configured fallback.
- Explains foreground/background lifecycle, wait/cancel, quota retry, and
  common configuration failures.

This skill does not contain credentials and does not replace the Miwarang
extension. Install and configure the extension separately.

## Delegation rules

The normal call is backend-agnostic:

```json
{
  "target": "category:deep-high",
  "prompt": "Investigate the architecture and return a decision-complete plan.",
  "cwd": "/workspace/project"
}
```

Do not pass `backend: "commandcode"` merely because OpenCode may be exhausted.
Miwarang's configured fallback chain selects the correct Command Code model
list. If a backend override is intentional, its route must define compatible
models for that harness.

Supported parameters:

| Parameter | Guidance |
| --- | --- |
| `target` | Full `category:<name>` or `agent:<name>` target. |
| `prompt` | Preserve the complete task and acceptance criteria. |
| `mode` | Omit for foreground; use `"background"` for asynchronous work. |
| `backend` | Omit for normal routing and fallback selection. |
| `model` | Omit the OMO session model; use only a live target-harness ID. |
| `agent` | Pass only when the configured harness route needs it. |
| `cwd` | Pass the absolute project directory when scope matters. |

For detailed contracts and error handling, see:

- [`skills/miwarang-delegation/references/parameter-contract.md`](skills/miwarang-delegation/references/parameter-contract.md)
- [`skills/miwarang-delegation/references/configuration.md`](skills/miwarang-delegation/references/configuration.md)
- [`skills/miwarang-delegation/references/lifecycle-and-troubleshooting.md`](skills/miwarang-delegation/references/lifecycle-and-troubleshooting.md)

## Configuration example

The recommended fallback shape is:

```json
{
  "backend": "opencode",
  "models": [
    "opencode-go/longcat-2.5-preview-free",
    "opencode/nemotron-3.5-lightning-free"
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
```

Keep the paid fallback list explicit. Do not put credentials in this
repository or in prompts.

## Background lifecycle

Background delegation returns a backend-specific identifier:

- Command Code returns `runId`.
- OpenCode returns `sessionId`.

Pass the same identifier to `miwarang_wait` or `miwarang_cancel`. After
extension or config changes, run `/reload` in the active OMO/Senpi session.

## Validate locally

```bash
node scripts/check-skill.mjs
gh skill publish --dry-run
```

## License

MIT
