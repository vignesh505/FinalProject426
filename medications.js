const express = require('express');
const db = require('./database');
const authMiddleware = require('./authMiddleware');
const router = express.Router();


router.get('/', authMiddleware, (req, res) => {
  db.all(
    `SELECT medications.*, categories.name AS category_name 
     FROM medications 
     LEFT JOIN categories ON medications.category_id = categories.id 
     WHERE medications.user_id = ?`,
    [req.session.userId],
    (err, medications) => {
      if (err) {
        console.error('Database error in GET /medications:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json(medications);
    }
  );
});


router.post('/', authMiddleware, (req, res) => {
  const { name, dosage, frequency, time, category_id } = req.body;

  if (!name || !dosage || !frequency || !time) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.run(
    'INSERT INTO medications (name, dosage, frequency, time, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, dosage, frequency, time, category_id || null, req.session.userId],
    function (err) {
      if (err) {
        console.error('Database error in POST /medications:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      res.json({ id: this.lastID, name, dosage, frequency, time, category_id });
    }
  );
});


router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, dosage, frequency, time, category_id } = req.body;

  if (!name || !dosage || !frequency || !time) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.run(
    `UPDATE medications 
     SET name = ?, dosage = ?, frequency = ?, time = ?, category_id = ? 
     WHERE id = ? AND user_id = ?`,
    [name, dosage, frequency, time, category_id || null, id, req.session.userId],
    function (err) {
      if (err) {
        console.error('Database error in PUT /medications:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Medication not found.' });
      }
      res.json({ message: 'Medication updated successfully!' });
    }
  );
});


router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM medications WHERE id = ? AND user_id = ?',
    [id, req.session.userId],
    function (err) {
      if (err) {
        console.error('Database error in DELETE /medications:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Medication not found.' });
      }
      res.json({ message: 'Medication deleted successfully!' });
    }
  );
});

module.exports = router;
