const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const geoip = require('geoip-lite');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const waitingUsers = [];

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  const geo = geoip.lookup(ip);
  socket.userCountry = geo ? geo.country : 'Unknown';

  socket.on('join', (profile) => {
    socket.profile = {
      ...profile,
      country: socket.userCountry,
    };
    console.log(`User joined: ${JSON.stringify(socket.profile)}`);

    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.shift();
      const roomID = `room-${socket.id}-${partnerSocket.id}`;

      socket.join(roomID);
      partnerSocket.join(roomID);

      socket.emit('matched', {
        room: roomID,
        partner: partnerSocket.profile,
      });
      partnerSocket.emit('matched', {
        room: roomID,
        partner: socket.profile,
      });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on('message', (data) => {
    io.to(data.room).emit('message', {
      message: data.message,
      sender: socket.profile,
    });
  });

  socket.on('disconnect', () => {
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
