# Open Obsidian Vault for Alfred

Open Obsidian vaults from Alfred with one keyword: `v`.

This workflow is for Obsidian users who keep several vaults and want fast fuzzy matching by vault name. It reads Obsidian's local vault registry, lists the known vaults in Alfred, and opens the selected vault with Obsidian's URI scheme.

## Features

- Fuzzy vault search from Alfred with `v `
- No manual vault configuration
- Uses Obsidian's local `obsidian.json` vault registry
- Opens vaults with `obsidian://open?vault=...`
- Dependency-free at runtime: Alfred uses macOS's built-in JavaScript for Automation

## Requirements

- macOS
- Alfred with Powerpack workflow support
- Obsidian installed
- At least one vault already opened/registered in Obsidian

## Install

Download or build `Open Obsidian Vault.alfredworkflow`, then double-click it to import into Alfred.

If Alfred does not refresh immediately after replacing an older copy, run `reload` in Alfred.

## Usage

Type `v ` in Alfred, then search for a vault:

```text
v fin
v jobs
```

Results show the real vault folder name:

```text
Finance
Jobs
```

Press Return to open the selected vault in Obsidian.

## How It Works

The workflow reads:

```text
~/Library/Application Support/obsidian/obsidian.json
```

It derives each vault name from the vault folder basename and searches against that full folder name.

No environment variables are required.

## Development

Build-time requirements:

- Node.js
- `rsvg-convert` from `librsvg`

Build the Alfred workflow package:

```sh
node build-workflow.js
```

Smoke test the Script Filter locally:

```sh
plutil -lint info.plist
plutil -convert json -o /tmp/open-obsidian-vault-info.json info.plist
node -e 'const p=require("/tmp/open-obsidian-vault-info.json"); const sf=p.objects.find(o=>o.type==="alfred.workflow.input.scriptfilter"); require("fs").writeFileSync("/tmp/open-obsidian-vault-list.js", sf.config.script)'
/usr/bin/osascript -l JavaScript /tmp/open-obsidian-vault-list.js fin
unzip -t "Open Obsidian Vault.alfredworkflow"
```

## Known Limitations

- The workflow can only list vaults that Obsidian has already registered locally.
- Fuzzy search is intentionally scoped to vault folder names, not full filesystem paths.
- No screenshots or demo GIF are included yet.

## License

MIT. See [LICENSE](LICENSE).
