const templates = {
  blank: "-- New Script\n",
  part: `local part = Instance.new("Part")
part.Size = Vector3.new(8, 1, 8)
part.Position = Vector3.new(0, 10, 0)
part.Anchored = true
part.Material = Enum.Material.Neon
part.BrickColor = BrickColor.new("Bright blue")
part.Parent = workspace
`,
  leaderstats: `game.Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = leaderstats
end)
`,
  remote: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local event = ReplicatedStorage:WaitForChild("ExampleEvent")

event.OnServerEvent:Connect(function(player, message)
    print(string.format("[%s] %s", player.Name, tostring(message)))
end)
`,
  tool: `local tool = script.Parent

local function onActivated()
    local character = tool.Parent
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.WalkSpeed = 24
        task.delay(3, function()
            humanoid.WalkSpeed = 16
        end)
    end
end

tool.Activated:Connect(onActivated)
`,
};

const seedExplorer = {
  name: "game",
  className: "DataModel",
  children: [
    {
      name: "Workspace",
      className: "Workspace",
      children: [
        { name: "Baseplate", className: "Part" },
        { name: "SpawnLocation", className: "SpawnLocation" },
      ],
    },
    {
      name: "ServerScriptService",
      className: "ServerScriptService",
      children: [{ name: "Main.server.lua", className: "Script", template: "leaderstats" }],
    },
    {
      name: "ReplicatedStorage",
      className: "ReplicatedStorage",
      children: [{ name: "ExampleEvent", className: "RemoteEvent", template: "remote" }],
    },
  ],
};

const editor = document.getElementById("editor");
const lineNumbers = document.getElementById("lineNumbers");
const statusBar = document.getElementById("statusBar");
const tabs = document.getElementById("tabs");
const output = document.getElementById("output");
const explorerTree = document.getElementById("explorerTree");
const properties = document.getElementById("properties");
const templateSelect = document.getElementById("templateSelect");
const loadTemplateBtn = document.getElementById("loadTemplateBtn");
const newTabBtn = document.getElementById("newTabBtn");
const saveLocalBtn = document.getElementById("saveLocalBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const clearOutputBtn = document.getElementById("clearOutputBtn");
const runBtn = document.getElementById("runBtn");
const stopBtn = document.getElementById("stopBtn");
const insertPartBtn = document.getElementById("insertPartBtn");
const insertSpawnBtn = document.getElementById("insertSpawnBtn");
const mockPart = document.getElementById("mockPart");
const mockSpawn = document.getElementById("mockSpawn");

let activeTabId = null;
let tabsState = [{ id: crypto.randomUUID(), name: "Main.server.lua", code: templates.leaderstats }];
let simulationRunning = false;

function logOutput(message) {
  const now = new Date().toLocaleTimeString("ja-JP");
  output.textContent += `[${now}] ${message}\n`;
  output.scrollTop = output.scrollHeight;
}

function renderLineNumbers() {
  const total = Math.max(editor.value.split("\n").length, 1);
  lineNumbers.innerHTML = Array.from({ length: total }, (_, i) => `<span>${i + 1}</span>`).join("");
  const currentLine = editor.value.slice(0, editor.selectionStart).split("\n").length;
  const lineStart = editor.value.lastIndexOf("\n", editor.selectionStart - 1);
  const col = editor.selectionStart - lineStart;
  statusBar.textContent = simulationRunning ? `Playing | Ln ${currentLine}, Col ${col}` : `Edit | Ln ${currentLine}, Col ${col}`;
}

function renderTabs() {
  tabs.innerHTML = "";
  tabsState.forEach((tab) => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.className = tab.id === activeTabId ? "tab active" : "tab";
    button.addEventListener("click", () => switchTab(tab.id));
    tabs.appendChild(button);
  });
}

function switchTab(tabId) {
  const tab = tabsState.find((item) => item.id === tabId);
  if (!tab) return;
  activeTabId = tabId;
  editor.value = tab.code;
  renderTabs();
  renderLineNumbers();
  logOutput(`タブ切り替え: ${tab.name}`);
}

function upsertActiveTabCode() {
  const tab = tabsState.find((item) => item.id === activeTabId);
  if (tab) tab.code = editor.value;
}

function createTab(name, templateKey = "blank") {
  const tab = { id: crypto.randomUUID(), name, code: templates[templateKey] || templates.blank };
  tabsState.push(tab);
  switchTab(tab.id);
}

function renderExplorerNode(node, depth = 0, path = "") {
  const currentPath = path ? `${path}.${node.name}` : node.name;
  const item = document.createElement("li");
  item.className = "tree-item";
  item.style.paddingLeft = `${depth * 12 + 8}px`;
  item.textContent = `${node.name} (${node.className})`;
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    properties.innerHTML = `<div><strong>Name:</strong> ${node.name}</div><div><strong>ClassName:</strong> ${node.className}</div><div><strong>Path:</strong> ${currentPath}</div>`;
    if (node.template) {
      createTab(node.name, node.template);
      logOutput(`Explorer から ${node.name} を開きました`);
    }
  });
  explorerTree.appendChild(item);

  if (node.children) {
    node.children.forEach((child) => renderExplorerNode(child, depth + 1, currentPath));
  }
}

function setSimulationState(isRunning) {
  simulationRunning = isRunning;
  document.body.classList.toggle("playing", simulationRunning);
  logOutput(simulationRunning ? "プレイ開始 (Mock)" : "プレイ停止");
  renderLineNumbers();
}

loadTemplateBtn.addEventListener("click", () => {
  editor.value = templates[templateSelect.value];
  upsertActiveTabCode();
  renderLineNumbers();
  logOutput(`テンプレート適用: ${templateSelect.value}`);
});

newTabBtn.addEventListener("click", () => createTab(`Script${tabsState.length + 1}.lua`, "blank"));

saveLocalBtn.addEventListener("click", () => {
  upsertActiveTabCode();
  localStorage.setItem("luau-web-studio-tabs", JSON.stringify(tabsState));
  localStorage.setItem("luau-web-studio-active", activeTabId);
  logOutput("ローカル保存しました");
});

copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(editor.value);
    copyCodeBtn.textContent = "Copied";
    logOutput("コードをコピーしました");
  } catch {
    copyCodeBtn.textContent = "Copy failed";
    logOutput("コピー失敗");
  }
  setTimeout(() => {
    copyCodeBtn.textContent = "Copy";
  }, 1200);
});

clearOutputBtn.addEventListener("click", () => {
  output.textContent = "";
});

runBtn.addEventListener("click", () => setSimulationState(true));
stopBtn.addEventListener("click", () => setSimulationState(false));

insertPartBtn.addEventListener("click", () => {
  mockPart.classList.toggle("visible");
  logOutput(mockPart.classList.contains("visible") ? "Viewport に Part を追加" : "Viewport の Part を削除");
});

insertSpawnBtn.addEventListener("click", () => {
  mockSpawn.classList.toggle("visible");
  logOutput(mockSpawn.classList.contains("visible") ? "Viewport に SpawnLocation を追加" : "Viewport の SpawnLocation を削除");
});

editor.addEventListener("input", () => {
  upsertActiveTabCode();
  renderLineNumbers();
});
editor.addEventListener("click", renderLineNumbers);
editor.addEventListener("keyup", renderLineNumbers);
editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
});

(function bootstrap() {
  const savedTabs = localStorage.getItem("luau-web-studio-tabs");
  const savedActive = localStorage.getItem("luau-web-studio-active");

  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs);
      if (Array.isArray(parsed) && parsed.length) tabsState = parsed;
    } catch {
      logOutput("保存データ読み込み失敗。初期状態で起動");
    }
  }

  renderExplorerNode(seedExplorer);
  renderTabs();
  switchTab(savedActive || tabsState[0].id);
  renderLineNumbers();
  logOutput("Luau Web Studio ready");
})();
