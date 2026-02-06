# Luau Web Studio

「Web 版 Roblox Studio っぽい体験」を目指した、Luau スクリプト練習用の静的アプリです。

## できること

- **Titlebar / Menubar / Ribbon** の Studio 風レイアウト
- **Viewport (Mock)** で Part / Spawn の表示切替
- **Explorer / Properties** 連携
- **Script Editor**（タブ、行番号、Ln/Col、テンプレート適用）
- **Output** ログ表示
- **Play/Stop (Mock)** 状態切り替え
- **localStorage 保存**（開いているタブとアクティブタブ）

## 起動

```bash
python3 -m http.server 4173
```

`http://localhost:4173` を開いて利用してください。

## 補足

このプロジェクトは **Roblox Studio 風 UI の練習用ツール** であり、Roblox 本体や executor ではありません。
