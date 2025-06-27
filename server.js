const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const DATA_FILE = path.join(__dirname, 'classData.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('クライアントが接続しました');

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === 'register') {
        const { name, number1, number2, number3, number4, number5, grade, class: classNum } = parsed.data;

        if (!name || grade == null || classNum == null) {
          ws.send(JSON.stringify({ type: 'error', message: '不正なデータです' }));
          return;
        }

        const data = loadData();
        const classKey = `${grade}-${classNum}`;

        if (!data[classKey]) {
          data[classKey] = [];
        }

        data[classKey].push({
          name,
          numbers: [number1, number2, number3, number4, number5],
          timestamp: new Date().toISOString()
        });

        saveData(data);
        ws.send(JSON.stringify({ type: 'success', message: '登録成功' }));

      } else if (parsed.type === 'get') {
        const { grade, class: classNum } = parsed;

        if (!grade || !classNum) {
          ws.send(JSON.stringify({ type: 'error', message: '学年とクラスを指定してください' }));
          return;
        }

        const data = loadData();
        const classKey = `${grade}-${classNum}`;
        const classData = data[classKey] || [];

        ws.send(JSON.stringify({ type: 'data', classKey, data: classData }));

      } else if (parsed.type === 'delete') {
        const { grade, class: classNum, name } = parsed.data;

        if (!grade || !classNum || !name) {
          ws.send(JSON.stringify({ type: 'error', message: '削除条件が不完全です' }));
          return;
        }

        const data = loadData();
        const classKey = `${grade}-${classNum}`;

        if (!data[classKey]) {
          ws.send(JSON.stringify({ type: 'error', message: '該当クラスのデータが存在しません' }));
          return;
        }

        const originalLength = data[classKey].length;
        data[classKey] = data[classKey].filter(entry => entry.name !== name);

        if (data[classKey].length < originalLength) {
          saveData(data);
          ws.send(JSON.stringify({ type: 'success', message: `${name} のデータを削除しました` }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `${name} のデータが見つかりませんでした` }));
        }

      } else {
        ws.send(JSON.stringify({ type: 'error', message: '不明なリクエストタイプです' }));
      }

    } catch (err) {
      console.error('エラー:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'サーバー内部エラー' }));
    }
  });

  ws.on('close', () => {
    console.log('クライアントが切断されました');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocketサーバーがポート${PORT}で起動しました`);
});
