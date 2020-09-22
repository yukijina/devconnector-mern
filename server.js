const express = require('express');
const cors = require('cors');
// path os for production
const path = require('path');

const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
// Connect Database
connectDB();

// Init Middleware - body parser
app.use(express.json({ extended: false }));

// Only for development
//app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // set static folder
  app.use(express.static('client/build'));
}
app.get('*', (req, res) => {
  // it gose from current directry - client colder - build - index.html
  // This app has client in the same github
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
