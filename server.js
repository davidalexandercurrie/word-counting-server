const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const path = require('path');
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('msg', () => {
    //api request
    let data = "I'm returning the data to you!";
    io.to(socket.id).emit('event', data);
  });
});

server.listen(PORT, () => {
  console.log('listening on *:3000');
});
