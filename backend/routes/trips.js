const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

// Get all planned trips
router.get('/', (req, res) => {
  const db = getDatabase();
  db.all('SELECT * FROM trips ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a specific trip by ID
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  
  db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    res.json(row);
  });
});

// Add a new planned trip
router.post('/', (req, res) => {
  const db = getDatabase();
  const { name, latitude, longitude, planned_date, notes } = req.body;

  console.log('POST /api/trips - Received data:', { name, latitude, longitude, planned_date, notes });

  if (!name || latitude === undefined || longitude === undefined) {
    console.error('Validation failed: missing required fields');
    res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    return;
  }

  db.run(
    'INSERT INTO trips (name, latitude, longitude, planned_date, notes) VALUES (?, ?, ?, ?, ?)',
    [name, latitude, longitude, planned_date || null, notes || null],
    function(err) {
      if (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      const savedTrip = { id: this.lastID, name, latitude, longitude, planned_date, notes };
      console.log('Trip saved successfully:', savedTrip);
      res.json(savedTrip);
    }
  );
});

// Update a trip
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  const { name, latitude, longitude, planned_date, notes } = req.body;

  db.run(
    'UPDATE trips SET name = ?, latitude = ?, longitude = ?, planned_date = ?, notes = ? WHERE id = ?',
    [name, latitude, longitude, planned_date, notes, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }
      res.json({ message: 'Trip updated successfully' });
    }
  );
});

// Delete a trip
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;

  db.run('DELETE FROM trips WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    res.json({ message: 'Trip deleted successfully' });
  });
});

module.exports = router;

