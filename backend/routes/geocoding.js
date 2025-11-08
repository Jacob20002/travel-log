const express = require('express');
const router = express.Router();
const https = require('https');

// Proxy endpoint for geocoding search (to avoid CORS issues)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    console.log('Geocoding search request for:', query);
    
    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&accept-language=en`;
    console.log('Fetching from Nominatim:', url);
    
    // Use Node.js https module for better compatibility
    const data = await new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'TravelLog/1.0'
        }
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => body += chunk);
        response.on('end', () => {
          console.log('Nominatim response status:', response.statusCode);
          if (response.statusCode !== 200) {
            console.error('Nominatim error response:', body);
            reject(new Error(`Nominatim API error: ${response.statusCode} - ${body.substring(0, 100)}`));
            return;
          }
          try {
            const parsed = JSON.parse(body);
            console.log('Nominatim returned', parsed.length, 'results');
            resolve(parsed);
          } catch (e) {
            console.error('JSON parse error:', e);
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    res.json(data);
  } catch (error) {
    console.error('Geocoding search error:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Proxy endpoint for reverse geocoding
router.get('/reverse', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    
    console.log('Reverse geocoding request for:', lat, lng);

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=en`;
    console.log('Fetching from Nominatim:', url);
    
    // Use Node.js https module for better compatibility
    const data = await new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'TravelLog/1.0'
        }
      }, (response) => {
        let body = '';
        response.on('data', (chunk) => body += chunk);
        response.on('end', () => {
          console.log('Nominatim reverse response status:', response.statusCode);
          if (response.statusCode !== 200) {
            console.error('Nominatim error response:', body);
            reject(new Error(`Nominatim API error: ${response.statusCode} - ${body.substring(0, 100)}`));
            return;
          }
          try {
            const parsed = JSON.parse(body);
            console.log('Nominatim reverse geocoding result:', parsed.display_name || 'No display name');
            resolve(parsed);
          } catch (e) {
            console.error('JSON parse error:', e);
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

module.exports = router;

