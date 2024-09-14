const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Inicializar o app Express e Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Permitir todas as origens para desenvolvimento
        methods: ["GET", "POST"]
    }
});

// Estrutura para armazenar salas e mensagens
const rooms = {};

// Middleware para permitir CORS e parsing de JSON
app.use(cors());
app.use(express.json());

// Rota para verificar se o servidor está rodando
app.get('/', (req, res) => {
    res.send('Servidor de Chat rodando');
});

// Rota para criar uma nova sala de chat (recebe dados do WordPress)
app.post('/create-room', (req, res) => {
    const { room, phone, email } = req.body;

    if (!rooms[room]) {
        rooms[room] = { phone, email, messages: [] };
        console.log(`Sala criada: ${room}`);
    } else {
        console.log(`Sala já existe: ${room}`);
    }

    res.json({ success: true, room });
});


// Gerenciar conexões Socket.io
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    // Cliente entra em uma sala
    socket.on('join-room', ({ room }) => {
        socket.join(room);
        console.log(`Cliente entrou na sala: ${room}`);
    });

    // Ao receber uma mensagem de um cliente
    socket.on('message', ({ room, message, sender }) => {
        console.log(`Mensagem recebida na sala ${room} de ${sender}: ${message}`);
        
        socket.to(room).emit('message', { room, message, sender });
        
        console.log(`Mensagem enviada para a sala ${room} de ${sender}: ${message}`);
    });

    // Desconexão de cliente
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar o servidor na porta 3000
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
