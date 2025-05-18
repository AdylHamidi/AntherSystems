const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const geoip = require('geoip-lite');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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
