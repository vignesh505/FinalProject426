const express = require('express');
const authMiddleware = require('./authMiddleware');
const db = require('./database');
const router = express.Router();


router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  db.run(
    'INSERT INTO categories (name, user_id) VALUES (?, ?)',
    [name, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      res.status(201).json({ id: this.lastID, name });
    }
  );
});


router.get('/', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM categories WHERE user_id = ?',
    [req.session.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json(rows);
    }
  );
});


router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  db.run(
    'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
    [name, id, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json({ message: 'Category updated successfully!' });
    }
  );
});


router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM categories WHERE id = ? AND user_id = ?',
    [id, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      res.json({ message: 'Category deleted successfully!' });
    }
  );
});

module.exports = router;
