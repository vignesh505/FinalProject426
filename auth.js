const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');

const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      (err) => {
        if (err) return res.status(400).json({ error: 'Username already exists.' });
        res.json({ message: 'User registered successfully!' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});


router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid username or password.' });

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid username or password.' });

      req.session.userId = user.id;
      res.json({ message: 'Login successful!' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
});


router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;

