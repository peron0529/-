const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');

const luaInput = document.getElementById('luaInput');
const autocompleteList = document.getElementById('autocompleteList');
const localOutput = document.getElementById('localOutput');
const runLocalBtn = document.getElementById('runLocalBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const clearLocalBtn = document.getElementById('clearLocalBtn');
const snippetList = document.getElementById('snippetList');

const STORAGE_KEY = 'lua-script-lab-local-code';
const MAX_SUGGESTIONS = 8;

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

const luaKeywords = [
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if',
  'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while',
  'pairs', 'ipairs', 'print', 'tostring', 'tonumber', 'math', 'table', 'string'
];

const robloxKeywords = [
  'game', 'workspace', 'script', 'Enum', 'Instance', 'wait', 'task.wait',
  'Players', 'LocalPlayer', 'CharacterAdded', 'Humanoid', 'UserInputService',
  'ContextActionService', 'ReplicatedStorage', 'RemoteEvent', 'ProximityPrompt',
  'Mouse', 'GetService', 'WaitForChild', 'FireServer', 'OnClientEvent'
];

const autocompletePool = [...new Set([...luaKeywords, ...robloxKeywords])];

const snippetAutocompletePool = robloxSnippets.map((snippet, index) => ({
  label: `local-${index + 1}-${snippet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  snippet
}));

runBtn?.addEventListener('click', () => {
  output.textContent = '実行結果: 15（for文で1〜5を合計）';
});

const setLocalOutput = (message) => {
  if (localOutput) {
    localOutput.textContent = message;
  }
};

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    setLocalOutput('出力: ブラウザ設定により保存データを読み込めませんでした。');
    return null;
  }
};

const safeStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    setLocalOutput('出力: ブラウザ設定により保存できませんでした。');
    return false;
  }
};

const safeStorageRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    setLocalOutput('出力: ブラウザ設定により削除できませんでした。');
  }
};

const loadSavedCode = () => {
  if (!luaInput) return;

  const savedCode = safeStorageGet(STORAGE_KEY);
  if (savedCode) {
    luaInput.value = savedCode;
    setLocalOutput('出力: 保存済みスクリプトを読み込みました。');
  }
};

const getCurrentWord = () => {
  if (!luaInput) return '';

  const position = luaInput.selectionStart;
  const leftText = luaInput.value.slice(0, position);
  const matched = leftText.match(/[A-Za-z_.:]+$/);
  return matched ? matched[0] : '';
};

const hideAutocomplete = () => {
  if (autocompleteList) {
    autocompleteList.innerHTML = '';
    autocompleteList.classList.remove('visible');
  }
};

const applySuggestion = (candidate, currentWord) => {
  if (!luaInput) return;

  const position = luaInput.selectionStart;
  const start = position - currentWord.length;
  const before = luaInput.value.slice(0, start);
  const after = luaInput.value.slice(position);
  luaInput.value = `${before}${candidate}${after}`;

  const cursor = start + candidate.length;
  luaInput.setSelectionRange(cursor, cursor);
  luaInput.focus();
  hideAutocomplete();
};

const applySnippetSuggestion = (snippet) => {
  if (!luaInput) return;

  luaInput.value = snippet.code;
  luaInput.focus();
  hideAutocomplete();
  setLocalOutput(`出力: 「${snippet.title}」をエディタに読み込みました。`);
};

const renderAutocomplete = () => {
  if (!luaInput || !autocompleteList) return;

  const currentWord = getCurrentWord();
  if (currentWord.length < 1) {
    hideAutocomplete();
    return;
  }

  const currentLower = currentWord.toLowerCase();
  const snippetSuggestions = snippetAutocompletePool
    .filter((item) => item.label.startsWith(currentLower))
    .slice(0, MAX_SUGGESTIONS);

  const keywordSuggestions = autocompletePool
    .filter((item) => item.toLowerCase().startsWith(currentLower) && item !== currentWord)
    .slice(0, MAX_SUGGESTIONS);

  if (!snippetSuggestions.length && !keywordSuggestions.length) {
    hideAutocomplete();
    return;
  }

  autocompleteList.innerHTML = '';
  snippetSuggestions.forEach((item) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'autocomplete-item';
    button.textContent = `${item.label}（テンプレ）`;
    button.dataset.kind = 'snippet';
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      applySnippetSuggestion(item.snippet);
    });
    li.appendChild(button);
    autocompleteList.appendChild(li);
  });

  keywordSuggestions.forEach((candidate) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'autocomplete-item';
    button.textContent = candidate;
    button.dataset.kind = 'keyword';
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      applySuggestion(candidate, currentWord);
    });
    li.appendChild(button);
    autocompleteList.appendChild(li);
  });

  autocompleteList.classList.add('visible');
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

  if (!snippetList.children.length) {
    snippetList.textContent = 'テンプレートの読み込みに失敗しました。再読み込みしてください。';
  }
};

saveLocalBtn?.addEventListener('click', () => {
  if (!luaInput) return;

  if (safeStorageSet(STORAGE_KEY, luaInput.value)) {
    setLocalOutput('出力: スクリプトをブラウザに保存しました。');
  }
});

clearLocalBtn?.addEventListener('click', () => {
  if (!luaInput) return;

  luaInput.value = '';
  safeStorageRemove(STORAGE_KEY);
  hideAutocomplete();
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

luaInput?.addEventListener('input', renderAutocomplete);
luaInput?.addEventListener('click', renderAutocomplete);
luaInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideAutocomplete();
  }

  if (event.key === 'Tab' && autocompleteList?.classList.contains('visible')) {
    const firstButton = autocompleteList.querySelector('.autocomplete-item');
    const currentWord = getCurrentWord();
    if (firstButton && currentWord) {
      event.preventDefault();
      if (firstButton.dataset.kind === 'snippet') {
        const matchedSnippet = snippetAutocompletePool.find(
          (item) => `${item.label}（テンプレ）` === (firstButton.textContent || '')
        );
        if (matchedSnippet) {
          applySnippetSuggestion(matchedSnippet.snippet);
          return;
        }
      }
      applySuggestion(firstButton.textContent || '', currentWord);
    }
  }
});

document.addEventListener('click', (event) => {
  if (!autocompleteList || !luaInput) return;
  if (event.target !== luaInput && !autocompleteList.contains(event.target)) {
    hideAutocomplete();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderSnippets();
  loadSavedCode();
  renderAutocomplete();
});
