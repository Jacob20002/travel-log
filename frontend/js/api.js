// API service for communicating with backend
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('API Request:', url, options);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log('API Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Location methods
    async getLocations() {
        return this.fetch(API_CONFIG.endpoints.locations);
    }

    async getLocation(id) {
        return this.fetch(`${API_CONFIG.endpoints.locations}/${id}`);
    }

    async createLocation(location) {
        return this.fetch(API_CONFIG.endpoints.locations, {
            method: 'POST',
            body: JSON.stringify(location)
        });
    }

    async updateLocation(id, location) {
        return this.fetch(`${API_CONFIG.endpoints.locations}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(location)
        });
    }

    async deleteLocation(id) {
        return this.fetch(`${API_CONFIG.endpoints.locations}/${id}`, {
            method: 'DELETE'
        });
    }

    // Trip methods
    async getTrips() {
        return this.fetch(API_CONFIG.endpoints.trips);
    }

    async getTrip(id) {
        return this.fetch(`${API_CONFIG.endpoints.trips}/${id}`);
    }

    async createTrip(trip) {
        return this.fetch(API_CONFIG.endpoints.trips, {
            method: 'POST',
            body: JSON.stringify(trip)
        });
    }

    async updateTrip(id, trip) {
        return this.fetch(`${API_CONFIG.endpoints.trips}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(trip)
        });
    }

    async deleteTrip(id) {
        return this.fetch(`${API_CONFIG.endpoints.trips}/${id}`, {
            method: 'DELETE'
        });
    }
}

const api = new ApiService();

