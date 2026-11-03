# Miwarang Delegation Skill v0.2.3

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
- Treats `omo.jsonc` as intent/category input only. OpenCode uses its harness
  default model and `orchestrator`; command routes use configured candidates.
- Documents enabling Command Code's `agent` and `agent_output` tools so its
  default `General` agent can delegate to installed harness agents.
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

Normal calls send only `target` and `prompt`, with `mode` or `cwd` only when
needed. Never send `backend`, `model`, or `agent` in normal routing. For
`target: "agent:explore"`, put the OMO agent name in `target` only; do not add
`agent: "explore"` or guess a backend key. Miwarang resolves the route and
configured fallback. OpenCode uses its configured default model and
`orchestrator` without querying its catalogue; Command Code uses its own
configured candidate list and optional live-catalogue probe.

If a call fails with `Backend ... is not configured`, remove the `backend`
override and retry with the same target and prompt. Only pass `backend` when
the user explicitly requires an override and you have verified that the value
is an exact key in the configured `backends` object.

`omo.jsonc` supplies delegation intent and category policy only. The parent
session's model is not a target-harness model. Command model probes happen
inside `miwarang_delegate` only when `listModelsArgv` is configured; a
separate model-list call is not required for normal routing.

Supported parameters:

| Parameter | Guidance |
| --- | --- |
| `target` | Full `category:<name>` or `agent:<name>` target. |
| `prompt` | Preserve the complete task and acceptance criteria. |
| `mode` | Omit for foreground; use `"background"` for asynchronous work. |
| `backend` | Omit; let Miwarang select the route and fallback. |
| `model` | Omit normally. Use only for an intentional command-backend override supported by that backend; OpenCode rejects it. |
| `agent` | Use only when command args support `{{agent}}`; OpenCode rejects it and always uses `orchestrator`. |
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

OpenCode routes omit `models`; OpenCode supplies its configured default model
and Miwarang selects `orchestrator`. Command Code tries its route candidates
in order without a free-only or cost-based filter. Keep free candidates first
and the low-cost fallback list explicit. Do not put credentials in this
repository or in prompts.

If a Command Code candidate is absent from its live catalogue, correct the
Command Code route's `models` list. Do not substitute an OpenCode model ID.
If OpenCode rejects a `model` or `agent` override, omit those parameters and
retry the same target.

## Background lifecycle

Background delegation returns a backend-specific identifier:

- Command Code returns `runId`.
- OpenCode returns `sessionId`.

Pass the same identifier to `miwarang_wait` or `miwarang_cancel`. After
extension or config changes, run `/reload` in the active OMO/Senpi session.
Miwarang does not create child OMO or DAG watcher processes; the main agent
owns all background IDs and waits for them directly.

## Validate locally

```bash
node scripts/check-skill.mjs
gh skill publish --dry-run
```

## License

MIT
