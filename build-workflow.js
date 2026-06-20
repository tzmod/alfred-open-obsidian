#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const listScript = fs.readFileSync("scripts/list-vaults.js", "utf8");
const openScript = fs.readFileSync("scripts/open-vault.js", "utf8");
const packageName = "Open Obsidian Vault.alfredworkflow";
const plutil = "/usr/bin/plutil";
const zip = "/usr/bin/zip";
const rsvgConvert = findExecutable([
  "/opt/homebrew/bin/rsvg-convert",
  "/usr/local/bin/rsvg-convert",
  "/usr/bin/rsvg-convert",
]);

const inputUid = "54B8D923-3C08-4CD2-8F05-0AF628F5C029";
const actionUid = "0796CFDE-8B84-4EAD-A82D-6558AF6C4D42";

const plist = {
  bundleid: "com.tzmod.alfred.open-obsidian-vault",
  category: "Productivity",
  connections: {
    [inputUid]: [
      {
        destinationuid: actionUid,
        modifiers: 0,
        modifiersubtext: "",
        vitoclose: false,
      },
    ],
  },
  createdby: "tzmod",
  description: "Open Obsidian vaults by name with fuzzy matching.",
  disabled: false,
  name: "Open Obsidian Vault",
  objects: [
    {
      config: {
        alfredfiltersresults: true,
        alfredfiltersresultsmatchmode: 0,
        argumenttreatemptyqueryasnil: true,
        argumenttrimmode: 0,
        argumenttype: 1,
        escaping: 68,
        keyword: "v",
        queuedelaycustom: 3,
        queuedelayimmediatelyinitially: true,
        queuedelaymode: 0,
        queuemode: 1,
        runningsubtext: "Searching Obsidian vaults...",
        script: listScript,
        scriptargtype: 1,
        scriptfile: "",
        subtext: "Type a vault name",
        title: "Open Obsidian Vault",
        type: 7,
        withspace: true,
      },
      type: "alfred.workflow.input.scriptfilter",
      uid: inputUid,
      version: 3,
    },
    {
      config: {
        concurrently: false,
        escaping: 68,
        script: openScript,
        scriptargtype: 1,
        scriptfile: "",
        type: 7,
      },
      type: "alfred.workflow.action.script",
      uid: actionUid,
      version: 2,
    },
  ],
  readme: "Type v followed by a vault name to fuzzy search Obsidian vaults. Press Return to open the selected vault.",
  uidata: {
    [inputUid]: {
      xpos: 120,
      ypos: 120,
    },
    [actionUid]: {
      xpos: 420,
      ypos: 120,
    },
  },
  userconfigurationconfig: [],
  variablesdontexport: [],
  version: "1.0.0",
  webaddress: "",
};

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "open-obsidian-vault-"));
const tmpJson = path.join(tmpDir, "info.json");

try {
  fs.writeFileSync(tmpJson, JSON.stringify(plist, null, 2));
  execFileSync(plutil, ["-convert", "xml1", "-o", "info.plist", tmpJson]);
  const normalizedTime = new Date("2020-01-01T00:00:00Z");
  fs.utimesSync("info.plist", normalizedTime, normalizedTime);
  execFileSync(rsvgConvert, ["--width", "512", "--height", "512", "--output", "icon.png", "assets/icon.svg"]);
  fs.utimesSync("icon.png", normalizedTime, normalizedTime);
  fs.rmSync(packageName, { force: true });
  execFileSync(zip, ["-X", "-j", packageName, "info.plist", "icon.png"], {
    stdio: "inherit",
  });
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function findExecutable(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    "rsvg-convert is required to build icon.png. Install librsvg, for example: brew install librsvg",
  );
}
