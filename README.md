# AntherSystems

A modern web platform featuring real-time chat with automatic language translation, inspired by space exploration and the mysteries of the universe.

## 🌟 Features

### Real-time Chat System
- Random chat matching with users worldwide
- Real-time message translation using DeepL API
- Support for multiple languages
- User profile system with age and gender preferences
- Automatic country detection
- Clean, modern UI with responsive design

### Authentication System
- Secure user registration and login
- JWT-based authentication
- PostgreSQL database integration
- Password encryption

### Space-Themed Design
- Immersive space-themed landing page
- Parallax scrolling effects
- Video background integration
- Modern, minimalist UI

## 🚀 Tech Stack

### Frontend
- HTML5
- CSS3 (with modern features like Flexbox and Grid)
- JavaScript (ES6+)
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- PostgreSQL
- DeepL API for translations
- JWT for authentication
- GeoIP for location detection

## 🛠️ Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/AdylHamidi/AntherSystems.git
cd AntherSystems
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# DeepL API Configuration
DEEPL_API_KEY=your-deepl-api-key
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📁 Project Structure

```
AntherSystems/
├── public/
│   ├── css/
│   ├── content/
│   ├── chat.html
│   ├── chatindex.html
│   ├── login.html
│   └── register.html
├── server.js
├── db.js
├── package.json
└── .env
```

## 🌐 Features in Detail

### Chat System
- Real-time message delivery
- Automatic language translation
- User matching based on preferences
- Country detection
- Session management
- Disconnect handling

### Authentication
- Secure user registration
- Email-based login
- JWT token generation
- Password encryption
- Session management

### UI/UX
- Responsive design
- Space-themed aesthetics
- Smooth animations
- Intuitive navigation
- Error handling with user feedback

## 🔒 Security Features

- Password encryption using bcrypt
- JWT-based authentication
- Environment variable protection
- Secure session handling
- Input validation
- XSS protection

## 🌍 Supported Languages

- English (US/UK)
- Spanish
- French
- German
- Italian
- Portuguese
- Dutch
- Polish
- Russian
- Japanese
- Chinese
- Arabic

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Adyl Hamidi

## 🙏 Acknowledgments

- DeepL API for translation services
- Socket.IO for real-time communication
- PostgreSQL for database management
- The space exploration community for inspiration

## 🌐 Live Demo

Visit [AntherSystems](https://anthersystems.com) to see the project in action.

---

Made with ❤️ for space exploration enthusiasts 