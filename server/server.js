const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

app.use(cors());

app.get('/', (req, res) => {
  res.send('Chat server is running');
});

app.post('/create-room', (req, res) => {
  const { room, phone, email } = req.query;
  if (!rooms[room]) {
    rooms[room] = { phone, email, messages: [] };
    console.log(`Room created: ${room}`);
  } else {
    console.log(`Room already exists: ${room}`);
  }
  res.json({ success: true, room });
});

app.post('/send-message', (req, res) => {
  const { room, message, sender } = req.query;
  if (rooms[room]) {
    rooms[room].messages.push({ sender, message });
    io.to(room).emit('message', { sender, message, room });
    console.log(`Message sent to room ${room}: ${message}`);
    res.json({ success: true });
  } else {
    console.log(`Room not found: ${room}`);
    res.json({ success: false, message: 'Room not found.' });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('join-room', ({ room }) => {
    socket.join(room);
    console.log(`Client joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


server.listen(3000, () => console.log('Server listening on port 3000'));