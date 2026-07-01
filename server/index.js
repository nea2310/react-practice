const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ---- Хранилище данных ----
// Теперь каждый элемент имеет уникальный id и текст
let dataStore = {
    items: [
        { id: 'init-1', text: 'Initial item 1' },
        { id: 'init-2', text: 'Initial item 2' },
    ],
    lastUpdate: Date.now(),
};

// Генератор уникальных id (простой счётчик)
let idCounter = 3;

function generateId() {
    return `item-${idCounter++}`;
}

// ---- 1. HTTP-эндпоинт для начальных данных ----
app.get('/api/initial-data', (req, res) => {
    // Возвращаем массив объектов с id и text
    res.json(dataStore);
});

// ---- 2. WebSocket-сервер ----
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('🟢 Новый WebSocket-клиент подключился');
    clients.add(ws);

    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket server' }));

    ws.on('message', (message) => {
        console.log('📩 Получено от клиента:', message.toString());
    });

    ws.on('close', () => {
        console.log('🔴 Клиент отключился');
        clients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error('Ошибка WebSocket:', err);
    });
});

// ---- 3. Эмуляция периодических обновлений ----
setInterval(() => {
    // Генерируем новое уведомление с id и text
    const newItem = {
        id: generateId(),
        text: `Item ${Date.now()}`,
    };
    dataStore.items.push(newItem);
    dataStore.lastUpdate = Date.now();

    // Отправляем всем клиентам массив с одним новым уведомлением
    const payload = JSON.stringify({
        type: 'update',
        payload: [newItem], // отправляем массив, чтобы клиент мог просто объединить
    });

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
    console.log(`📤 Отправлено обновление: ${newItem.text} (id: ${newItem.id})`);
}, 10000); // каждые 30 секунд

// ---- 4. Запуск сервера ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`🔌 WebSocket доступен на ws://localhost:${PORT}`);
});