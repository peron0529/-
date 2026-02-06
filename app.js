const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');

runBtn?.addEventListener('click', () => {
  output.textContent = '実行結果: 15（for文で1〜5を合計）';
});
