const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Schemas
const memberSchema = new mongoose.Schema({
  name: String,
  age: Number,
  plan: String
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Member = mongoose.model('Member', memberSchema);
const User = mongoose.model('User', userSchema);

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/members', auth, async (req, res) => {
  const members = await Member.find();
  res.json(members);
});

app.post('/api/members', auth, async (req, res) => {
  const member = new Member(req.body);
  await member.save();
  res.status(201).json(member);
});

app.delete('/api/members/:id', auth, async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.json({ message: 'Member deleted' });
});

// Seed Admin User
(async () => {
  const admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await new User({ username: 'admin', password: hashedPassword }).save();
    console.log('Admin created');
  }
})();

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
