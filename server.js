const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const geoip = require('geoip-lite');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { Translator } = require('deepl-node');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize DeepL translator only if API key is available
let translator = null;
if (process.env.DEEPL_API_KEY) {
    translator = new Translator(process.env.DEEPL_API_KEY);
} else {
    console.warn('DeepL API key not found. Translation features will be disabled.');
}

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        console.log('Login attempt for email:', email);
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        console.log('User found:', { id: user.id, email: user.email });
        
        if (password !== user.password) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set');
            return res.status(500).json({ message: 'Server configuration error: JWT secret missing.' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('Login successful for user:', email);
        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        console.log('Registration attempt for email:', email);
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            console.log('Email already registered:', email);
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password]
        );
        
        console.log('Registration successful for user:', email);
        res.status(201).json({ 
            message: 'Registration successful',
            userId: result.rows[0].id
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
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

  socket.on('message', async (data) => {
    try {
      const room = io.sockets.adapter.rooms.get(data.room);
      const sockets = Array.from(room);
      
      // Find the correct sender and receiver sockets
      const senderSocket = io.sockets.sockets.get(socket.id);
      const receiverSocket = io.sockets.sockets.get(
        sockets.find(id => id !== socket.id)
      );

      if (!senderSocket || !receiverSocket) {
        console.error('Could not find sender or receiver socket');
        return;
      }

      // Get the original message
      const originalMessage = data.message;

      // If languages are different and translator is available, translate the message
      if (senderSocket.profile.language !== receiverSocket.profile.language && translator) {
        try {
          // Translate from sender's language to receiver's language
          const translation = await translator.translateText(
            originalMessage,
            senderSocket.profile.language,
            receiverSocket.profile.language
          );

          // Send original message to sender
          senderSocket.emit('message', {
            message: originalMessage,
            sender: senderSocket.profile,
            isOriginal: true
          });

          // Send translated message to receiver
          receiverSocket.emit('message', {
            message: translation.text,
            sender: senderSocket.profile,
            isOriginal: false,
            originalMessage: originalMessage,
            fromLanguage: senderSocket.profile.language,
            toLanguage: receiverSocket.profile.language
          });
        } catch (translationError) {
          console.error('Translation error:', translationError);
          // If translation fails, send the original message to both
          io.to(data.room).emit('message', {
            message: originalMessage,
            sender: senderSocket.profile,
            isOriginal: true
          });
        }
      } else {
        // If languages are the same or translator is not available, send the original message to both
        io.to(data.room).emit('message', {
          message: originalMessage,
          sender: senderSocket.profile,
          isOriginal: true
        });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      // If any error occurs, send the original message
      io.to(data.room).emit('message', {
        message: data.message,
        sender: socket.profile,
        isOriginal: true
      });
    }
  });

  socket.on('disconnect', () => {
    const index = waitingUsers.indexOf(socket);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }

    // Notify partner if they were in a chat room
    if (socket.profile && socket.rooms) {
      socket.rooms.forEach(room => {
        if (room.startsWith('room-')) {
          const roomSockets = Array.from(io.sockets.adapter.rooms.get(room) || []);
          const partnerSocket = roomSockets.find(id => id !== socket.id);
          
          if (partnerSocket) {
            io.to(partnerSocket).emit('partner_disconnected');
          }
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
