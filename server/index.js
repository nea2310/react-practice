const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ---- In-memory база пользователей ----
const users = []; // { id, username, passwordHash }

// ---- Хранилище уведомлений ----
let dataStore = {
    items: [
        { id: 'init-1', text: 'Initial item 1' },
        { id: 'init-2', text: 'Initial item 2' },
    ],
    lastUpdate: Date.now(),
};
let idCounter = 3;

function generateId() {
    return `item-${idCounter++}`;
}

// ---- HTTP эндпоинты ----
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), username, passwordHash };
    users.push(user);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username } });
});

// ---- Middleware для проверки токена (опционально) ----
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is protected', user: req.user });
});

// ---- Получение начальных данных (защищённый эндпоинт) ----
app.get('/api/initial-data', authenticateToken, (req, res) => {
    res.json(dataStore);
});

// ---- WebSocket с аутентификацией ----
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

// Парсим токен из query-параметра
function getTokenFromUrl(url) {
    // Подставляем фиктивный хост для правильного парсинга
    const parsedUrl = new URL(url, `http://localhost:${PORT}`);
    return parsedUrl.searchParams.get('token');
}

wss.on('connection', (ws, req) => {
    const token = getTokenFromUrl(req.url);
    if (!token) {
        ws.close(1008, 'Unauthorized');
        return;
    }
    let user;
    try {
        user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        ws.close(1008, 'Unauthorized');
        return;
    }
    console.log(`✅ User ${user.username} connected`);
    ws.user = user;
    clients.add(ws);

    ws.on('message', (message) => {
        console.log('📩 Получено от клиента:', message.toString());
    });

    ws.on('close', () => {
        console.log('🔴 Клиент отключился');
        clients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err);
    });
});

// ---- Эмуляция периодических обновлений ----
setInterval(() => {
    const newItem = {
        id: generateId(),
        text: `Item ${Date.now()}`,
    };
    dataStore.items.push(newItem);
    dataStore.lastUpdate = Date.now();

    const payload = JSON.stringify({
        type: 'update',
        payload: [newItem],
    });

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
    console.log(`📤 Отправлено обновление: ${newItem.text} (id: ${newItem.id})`);
}, 10000);

// ---- Запуск сервера ----
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});