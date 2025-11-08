const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');

// Get all visited locations
router.get('/', (req, res) => {
  const db = getDatabase();
  db.all('SELECT * FROM locations ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a specific location by ID
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  
  db.get('SELECT * FROM locations WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(row);
  });
});

// Add a new visited location
router.post('/', (req, res) => {
  const db = getDatabase();
  const { name, latitude, longitude, visited_date, notes } = req.body;

  console.log('POST /api/locations - Received data:', { name, latitude, longitude, visited_date, notes });

  if (!name || latitude === undefined || longitude === undefined) {
    console.error('Validation failed: missing required fields');
    res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    return;
  }

  db.run(
    'INSERT INTO locations (name, latitude, longitude, visited_date, notes) VALUES (?, ?, ?, ?, ?)',
    [name, latitude, longitude, visited_date || null, notes || null],
    function(err) {
      if (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      const savedLocation = { id: this.lastID, name, latitude, longitude, visited_date, notes };
      console.log('Location saved successfully:', savedLocation);
      res.json(savedLocation);
    }
  );
});

// Update a location
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  const { name, latitude, longitude, visited_date, notes } = req.body;

  db.run(
    'UPDATE locations SET name = ?, latitude = ?, longitude = ?, visited_date = ?, notes = ? WHERE id = ?',
    [name, latitude, longitude, visited_date, notes, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Location not found' });
        return;
      }
      res.json({ message: 'Location updated successfully' });
    }
  );
});

// Delete a location
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;

  db.run('DELETE FROM locations WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json({ message: 'Location deleted successfully' });
  });
});

module.exports = router;

