const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');

const luaInput = document.getElementById('luaInput');
const localOutput = document.getElementById('localOutput');
const runLocalBtn = document.getElementById('runLocalBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const clearLocalBtn = document.getElementById('clearLocalBtn');

const STORAGE_KEY = 'lua-script-lab-local-code';

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

loadSavedCode();
