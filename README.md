# Miwarang Delegation Skill

An Agent Skill that makes Miwarang the default routing layer for OMO category
and agent delegation.

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

This skill does not contain credentials and does not replace the Miwarang
extension. Install and configure the extension separately.

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

## Validate locally

```bash
node scripts/check-skill.mjs
```

## License

MIT
