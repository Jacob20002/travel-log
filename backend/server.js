const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, getDatabase } = require('./database/db');
const locationsRouter = require('./routes/locations');
const tripsRouter = require('./routes/trips');
const geocodingRouter = require('./routes/geocoding');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/locations', locationsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/geocoding', geocodingRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Travel Log API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

