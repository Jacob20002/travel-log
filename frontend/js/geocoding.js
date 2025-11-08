// Geocoding service for getting location names
class GeocodingService {
    constructor() {
        this.nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
        this.cache = new Map(); // Cache for geocoding results
    }

    async getLocationName(lat, lng) {
        // Create cache key
        const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Use backend proxy for reverse geocoding to avoid CORS issues
            const baseUrl = window.location.origin; // e.g., 'http://localhost'
            const url = `${baseUrl}/api/geocoding/reverse?lat=${lat}&lon=${lng}`;
            
            console.log('Geocoding URL:', url);
            
            const response = await fetch(url);

            console.log('Geocoding response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Geocoding failed:', response.status, errorData);
                throw new Error(errorData.error || `Geocoding failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Geocoding response data:', data);
            
            // Extract location name from response
            let locationName = null;
            
            if (data.address) {
                // Try to get city/town name first (prioritize English names)
                // For Asian countries, we want English names, not local script
                locationName = data.address.city || 
                              data.address.town || 
                              data.address.village || 
                              data.address.municipality ||
                              data.address.county ||
                              data.address.state ||
                              data.address.country;
                
                // If we have a city, try to add country for clarity
                if (data.address.city || data.address.town || data.address.village) {
                    if (data.address.country && data.address.country !== locationName) {
                        locationName = `${locationName}, ${data.address.country}`;
                    }
                }
            }
            
            // Fallback: Parse display_name to get English name
            // display_name format: "City, State, Country" or "City, Country"
            if (!locationName && data.display_name) {
                const parts = data.display_name.split(',');
                // Take the first part (usually the city name)
                // For better results with Asian cities, we might need to parse differently
                locationName = parts[0].trim();
                
                // If we have country info, add it
                if (data.address && data.address.country && parts.length > 1) {
                    locationName = `${locationName}, ${data.address.country}`;
                }
            }

            // Cache the result
            if (locationName) {
                this.cache.set(cacheKey, locationName);
            }

            return locationName || 'Unknown Location';
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    // Search for cities/locations by name
    async searchLocation(query) {
        try {
            console.log('Searching for:', query);
            // Use backend proxy to avoid CORS issues
            const baseUrl = window.location.origin; // e.g., 'http://localhost'
            const url = `${baseUrl}/api/geocoding/search?q=${encodeURIComponent(query)}`;
            
            console.log('Search URL:', url);
            console.log('API_CONFIG.baseURL:', API_CONFIG.baseURL);
            
            const response = await fetch(url);

            console.log('Search response status:', response.status);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('Search failed - could not parse error:', response.status, errorText);
                    throw new Error(`Search failed: ${response.status} - ${errorText.substring(0, 100)}`);
                }
                console.error('Search failed:', response.status, errorData);
                throw new Error(errorData.error || `Search failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search results:', data);
            
            if (!Array.isArray(data)) {
                console.error('Unexpected response format:', data);
                throw new Error('Invalid response format from server');
            }
            
            // Format results
            const results = data.map(item => {
                // Extract city name and country
                let displayName = item.display_name;
                const parts = displayName.split(',');
                
                // Try to get a clean city name
                let cityName = parts[0].trim();
                let country = '';
                
                // Find country in the address parts
                if (item.address) {
                    country = item.address.country || '';
                    if (item.address.city || item.address.town || item.address.village) {
                        cityName = item.address.city || item.address.town || item.address.village;
                    }
                } else {
                    // Fallback: try to extract from display_name
                    const lastPart = parts[parts.length - 1].trim();
                    if (lastPart && lastPart.length < 50) {
                        country = lastPart;
                    }
                }
                
                const fullName = country ? `${cityName}, ${country}` : cityName;
                
                return {
                    name: fullName,
                    cityName: cityName,
                    country: country,
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    displayName: displayName,
                    type: item.type || 'city'
                };
            });

            return results;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Clear cache if needed
    clearCache() {
        this.cache.clear();
    }
}

const geocoding = new GeocodingService();

