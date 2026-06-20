function run(argv) {
  ObjC.import("Foundation");

  const app = Application.currentApplication();
  app.includeStandardAdditions = true;

  const vaultName = argv.join(" ").trim();
  if (!vaultName) return "";

  const vault = findRegisteredVault(vaultName);
  if (!vault) {
    return "";
  }

  const url = `obsidian://open?vault=${encodeURIComponent(vault.name)}`;
  app.openLocation(url);

  return "";
}

function findRegisteredVault(vaultName) {
  const home = ObjC.unwrap($.NSHomeDirectory());
  const configPath = `${home}/Library/Application Support/obsidian/obsidian.json`;
  const fileManager = $.NSFileManager.defaultManager;

  if (!fileManager.fileExistsAtPath($(configPath))) return null;

  const rawConfig = $.NSString.stringWithContentsOfFileEncodingError(
    $(configPath),
    $.NSUTF8StringEncoding,
    null,
  );
  if (!rawConfig) return null;

  let parsed;
  try {
    parsed = JSON.parse(ObjC.unwrap(rawConfig));
  } catch (_error) {
    return null;
  }

  const vaults = parsed.vaults || {};
  const names = Object.keys(vaults).map((id) => basename(String(vaults[id].path || "")));
  return names.includes(vaultName) ? { name: vaultName } : null;
}

function basename(value) {
  return String(value || "").replace(/\/+$/, "").split("/").pop();
}
