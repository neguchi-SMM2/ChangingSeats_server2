const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'classData.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 受け取るデータ：{ name: "名前", number1: 1, number2: 2, number3: 3, grade: 1, class: 2 }
app.post('/register', (req, res) => {
  const { name, number1, number2, number3, grade, class: classNum } = req.body;

  if (!name || grade == null || classNum == null) {
    return res.status(400).json({ message: '不正なデータです' });
  }

  const data = loadData();
  const classKey = `${grade}-${classNum}`;

  if (!data[classKey]) {
    data[classKey] = [];
  }

  data[classKey].push({
    name,
    numbers: [number1, number2, number3],
    timestamp: new Date().toISOString()
  });

  saveData(data);
  res.json({ message: '登録成功' });
});

// GET /data?grade=1&class=2
app.get('/data', (req, res) => {
  const { grade, class: classNum } = req.query;

  if (!grade || !classNum) {
    return res.status(400).json({ message: '学年とクラスを指定してください' });
  }

  const data = loadData();
  const classKey = `${grade}-${classNum}`;
  res.json(data[classKey] || []);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
