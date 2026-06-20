function run(argv) {
  ObjC.import("Foundation");

  const query = normalize(argv.join(" "));
  const home = ObjC.unwrap($.NSHomeDirectory());
  const configPath = `${home}/Library/Application Support/obsidian/obsidian.json`;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function compact(value) {
    return normalize(value).replace(/[^a-z0-9]/g, "");
  }

  function basename(value) {
    return String(value || "").replace(/\/+$/, "").split("/").pop();
  }

  function exists(filePath) {
    return $.NSFileManager.defaultManager.fileExistsAtPath($(filePath));
  }

  function readText(filePath) {
    const text = $.NSString.stringWithContentsOfFileEncodingError(
      $(filePath),
      $.NSUTF8StringEncoding,
      null,
    );
    return text ? ObjC.unwrap(text) : null;
  }

  function fuzzyScore(rawQuery, candidates) {
    if (!rawQuery) return 0;

    const q = compact(rawQuery);
    if (!q) return 0;

    let best = -Infinity;
    candidates.forEach((candidate) => {
      const c = compact(candidate);
      if (!c) return;

      if (c === q) best = Math.max(best, 1000);
      if (c.indexOf(q) === 0) best = Math.max(best, 850 - (c.length - q.length));
      if (c.indexOf(q) >= 0) best = Math.max(best, 700 - c.indexOf(q));

      let qi = 0;
      let score = 0;
      let lastIndex = -2;
      let firstIndex = -1;

      for (let ci = 0; ci < c.length && qi < q.length; ci += 1) {
        if (c[ci] !== q[qi]) continue;

        if (firstIndex === -1) firstIndex = ci;
        score += 18;
        if (ci === lastIndex + 1) score += 10;
        score -= Math.max(0, ci - lastIndex - 1);
        lastIndex = ci;
        qi += 1;
      }

      if (qi === q.length) {
        score += 240;
        score -= firstIndex * 3;
        score -= Math.max(0, c.length - q.length);
        best = Math.max(best, score);
      }
    });

    return best;
  }

  function minimumScore(rawQuery) {
    const length = compact(rawQuery).length;
    return length <= 1 ? 240 : 300;
  }

  function errorResult(title, subtitle) {
    return JSON.stringify({
      items: [
        {
          title,
          subtitle,
          valid: false,
          icon: {
            path: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns",
          },
        },
      ],
    });
  }

  if (!exists(configPath)) {
    return errorResult(
      "Obsidian vault registry not found",
      "Open Obsidian once so it can create a local vault registry.",
    );
  }

  const rawConfig = readText(configPath);
  if (!rawConfig) {
    return errorResult("Could not read Obsidian vault registry", "Check Obsidian's local app data.");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawConfig);
  } catch (error) {
    return errorResult("Could not parse Obsidian vault registry", error.message);
  }

  const vaults = Object.keys(parsed.vaults || {})
    .map((id) => {
      const vault = parsed.vaults[id] || {};
      const vaultPath = String(vault.path || "");
      const name = basename(vaultPath);
      const candidates = [name].concat(name.split(/\s+/));

      return {
        id,
        path: vaultPath,
        name,
        exists: vaultPath ? exists(vaultPath) : false,
        isOpen: Boolean(vault.open),
        ts: Number(vault.ts || 0),
        candidates,
      };
    })
    .filter((vault) => vault.path && vault.name);

  const scored = vaults
    .map((vault) => ({
      vault,
      score: query ? fuzzyScore(query, vault.candidates) : 0,
    }))
    .filter((entry) => !query || entry.score >= minimumScore(query))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (Number(b.vault.isOpen) !== Number(a.vault.isOpen)) {
        return Number(b.vault.isOpen) - Number(a.vault.isOpen);
      }
      if (b.vault.ts !== a.vault.ts) return b.vault.ts - a.vault.ts;
      return a.vault.name.localeCompare(b.vault.name);
    });

  const items = scored.map((entry) => {
    const vault = entry.vault;
    const title = vault.name;
    const subtitle = vault.exists ? "Open this vault in Obsidian" : "Vault path is not available";

    return {
      title,
      subtitle,
      arg: vault.name,
      autocomplete: vault.name,
      match: vault.name,
      valid: vault.exists,
    };
  });

  return JSON.stringify({
    skipknowledge: true,
    items: items.length
      ? items
      : [
          {
            title: "No matching Obsidian vaults",
            subtitle: "Try a different vault name",
            valid: false,
          },
        ],
  });
}
