iPhone向け Task Manager

【ファイル】
index.html  : 画面
style.css   : iPhone向けデザイン
app.js      : タスク・Todo・履歴の処理
tasks.json  : 初期タスクデータ

【使い方】
1. index.html をSafariなどで開く。
2. タスク画面の「tasks.jsonを読み込む」から、同梱のtasks.jsonを選ぶ。
   （環境によっては自動読み込みされます）
3. 以後の追加・編集・Todo・履歴はiPhoneのブラウザ内に保存されます。

【注意】
ブラウザの仕様上、iPhoneからtasks.jsonそのものを書き換えることはしません。
tasks.jsonは初期データの読み込み用です。
一度読み込んだ後はlocalStorageが実質的なデータ保存先になります。
ブラウザのサイトデータを消去すると保存内容も消えるので注意してください。
