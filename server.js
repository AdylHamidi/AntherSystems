// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const geoip = require('geoip-lite');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// A waiting list for unpaired users
const waitingUsers = [];

io.on('connection', (socket) => {
  // Determine the user's IP address and country
  const ip = socket.handshake.address;
  const geo = geoip.lookup(ip);
  socket.userCountry = geo ? geo.country : 'Unknown';

  // Listen for the client to "join" with a specific profile
  socket.on('join', (profile) => {
    // Attach the profile + country to this socket
    socket.profile = {
      ...profile,
      country: socket.userCountry,
    };
    console.log(`User joined: ${JSON.stringify(socket.profile)}`);

    // Attempt to pair with someone waiting
    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.shift();
      const roomID = `room-${socket.id}-${partnerSocket.id}`;

      // Join both sockets to the same room
      socket.join(roomID);
      partnerSocket.join(roomID);

      // Notify both clients that they're matched
      socket.emit('matched', {
        room: roomID,
        partner: partnerSocket.profile,
      });
      partnerSocket.emit('matched', {
        room: roomID,
        partner: socket.profile,
      });
    } else {
      // If no one is waiting, this user goes in the queue
      waitingUsers.push(socket);
    }
  });

  // Listen for chat messages and broadcast them to the room
  socket.on('message', (data) => {
    io.to(data.room).emit('message', {
      message: data.message,
      sender: socket.profile,
    });
  });

  // When a user disconnects, remove them from the waiting queue if present
  socket.on('disconnect', () => {
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
    // Optionally, you could inform the partner that this user disconnected
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
