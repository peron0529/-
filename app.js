const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');

const luaInput = document.getElementById('luaInput');
const localOutput = document.getElementById('localOutput');
const runLocalBtn = document.getElementById('runLocalBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const clearLocalBtn = document.getElementById('clearLocalBtn');
const snippetList = document.getElementById('snippetList');

const STORAGE_KEY = 'lua-script-lab-local-code';

const robloxSnippets = [
  {
    title: '1) ClickDetectorでローカルUI表示',
    description: 'パーツクリックでGUIの表示をトグルする基本形。',
    code: `local player = game.Players.LocalPlayer
local mouse = player:GetMouse()
local gui = player:WaitForChild("PlayerGui"):WaitForChild("MainGui")

mouse.Button1Down:Connect(function()
  local target = mouse.Target
  if target and target:FindFirstChildOfClass("ClickDetector") then
    gui.Enabled = not gui.Enabled
  end
end)`
  },
  {
    title: '2) Shiftキーでダッシュ',
    description: 'UserInputServiceで入力を拾ってWalkSpeed変更。',
    code: `local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local normalSpeed = 16
local dashSpeed = 28

UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.LeftShift then
    humanoid.WalkSpeed = dashSpeed
  end
end)

UserInputService.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    humanoid.WalkSpeed = normalSpeed
  end
end)`
  },
  {
    title: '3) RemoteEventでサーバーへ通知',
    description: 'LocalScriptから安全にサーバー処理を呼ぶ定番。',
    code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local event = ReplicatedStorage:WaitForChild("PurchaseItem")

local itemId = "sword_01"
event:FireServer(itemId)`
  },
  {
    title: '4) ProximityPrompt反応',
    description: '近接インタラクトのTriggeredイベントを利用。',
    code: `local player = game.Players.LocalPlayer
local prompt = workspace:WaitForChild("NPC")
  :WaitForChild("Head")
  :WaitForChild("ProximityPrompt")

prompt.Triggered:Connect(function(triggeringPlayer)
  if triggeringPlayer == player then
    print("会話を開始")
  end
end)`
  },
  {
    title: '5) Tool装備時のアニメ再生',
    description: 'HumanoidへAnimationTrackをLoadして再生する型。',
    code: `local tool = script.Parent
local player = game.Players.LocalPlayer

local anim = Instance.new("Animation")
anim.AnimationId = "rbxassetid://0000000000"

local track

tool.Equipped:Connect(function()
  local character = player.Character or player.CharacterAdded:Wait()
  local humanoid = character:WaitForChild("Humanoid")
  track = humanoid:LoadAnimation(anim)
  track:Play()
end)

tool.Unequipped:Connect(function()
  if track then
    track:Stop()
  end
end)`
  }
];

runBtn?.addEventListener('click', () => {
  output.textContent = '実行結果: 15（for文で1〜5を合計）';
});

const setLocalOutput = (message) => {
  if (localOutput) {
    localOutput.textContent = message;
  }
};

const loadSavedCode = () => {
  if (!luaInput) return;

  const savedCode = localStorage.getItem(STORAGE_KEY);
  if (savedCode) {
    luaInput.value = savedCode;
    setLocalOutput('出力: 保存済みスクリプトを読み込みました。');
  }
};

const renderSnippets = () => {
  if (!snippetList || !luaInput) return;

  snippetList.innerHTML = '';

  robloxSnippets.forEach((snippet) => {
    const article = document.createElement('article');
    article.className = 'snippet-card';

    const title = document.createElement('h3');
    title.textContent = snippet.title;

    const desc = document.createElement('p');
    desc.className = 'snippet-description';
    desc.textContent = snippet.description;

    const pre = document.createElement('pre');
    pre.textContent = snippet.code;

    const button = document.createElement('button');
    button.className = 'secondary';
    button.textContent = 'このテンプレをエディタへ挿入';
    button.addEventListener('click', () => {
      luaInput.value = snippet.code;
      luaInput.focus();
      setLocalOutput(`出力: 「${snippet.title}」をエディタに読み込みました。`);
    });

    article.append(title, desc, pre, button);
    snippetList.appendChild(article);
  });
};

saveLocalBtn?.addEventListener('click', () => {
  if (!luaInput) return;

  localStorage.setItem(STORAGE_KEY, luaInput.value);
  setLocalOutput('出力: スクリプトをブラウザに保存しました。');
});

clearLocalBtn?.addEventListener('click', () => {
  if (!luaInput) return;

  luaInput.value = '';
  localStorage.removeItem(STORAGE_KEY);
  setLocalOutput('出力: エディタ内容をクリアしました。');
});

runLocalBtn?.addEventListener('click', () => {
  if (!luaInput) return;

  const script = luaInput.value.trim();
  if (!script) {
    setLocalOutput('出力: 実行するLuaコードを入力してください。');
    return;
  }

  if (!window.fengari || typeof window.fengari.load !== 'function') {
    setLocalOutput('出力: Lua実行エンジンの読み込みに失敗しました。ネットワーク状態を確認してください。');
    return;
  }

  const wrappedScript = `
local __out = {}
local function print(...)
  local parts = {}
  for i = 1, select('#', ...) do
    parts[#parts + 1] = tostring(select(i, ...))
  end
  __out[#__out + 1] = table.concat(parts, "\t")
end

${script}

return table.concat(__out, "\n")
`;

  try {
    const result = window.fengari.load(wrappedScript)();
    const text = result ? String(result) : '(出力なし)';
    setLocalOutput(`出力:\n${text}`);
  } catch (error) {
    setLocalOutput(`出力: 実行エラー\n${error}`);
  }
});

renderSnippets();
loadSavedCode();
