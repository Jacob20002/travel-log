// Main application controller
class TravelLogApp {
    constructor() {
        this.mapManager = new MapManager('map');
        this.uiManager = new UIManager();
        this.init();
    }

    async init() {
        // Load initial data
        await this.loadData();

        // Listen for mode changes
        window.addEventListener('modeChanged', () => {
            this.loadData();
        });

        // Listen for data changes
        window.addEventListener('dataChanged', () => {
            this.loadData();
        });

        // Listen for location selection
        window.addEventListener('locationSelected', (e) => {
            const { location, type } = e.detail;
            const markerMap = type === 'visited' 
                ? this.mapManager.visitedMarkers 
                : this.mapManager.plannedMarkers;
            
            const item = markerMap.get(location.id);
            if (item) {
                this.mapManager.selectMarker(item.marker, location, type);
                this.mapManager.map.setView([location.latitude, location.longitude], 8);
            }
        });

        // Listen for selection cleared
        window.addEventListener('selectionCleared', () => {
            this.mapManager.clearSelection();
        });

        // Handle map clicks for adding new locations
        this.mapManager.map.on('click', (e) => {
            console.log('Map clicked at:', e.latlng);
            
            // Don't show popup if clicking on existing marker
            if (e.originalEvent && e.originalEvent.target) {
                const target = e.originalEvent.target;
                if (target.closest('.leaflet-popup') || 
                    target.closest('.custom-marker') ||
                    target.closest('.leaflet-marker-icon')) {
                    console.log('Clicked on marker, ignoring');
                    return;
                }
            }
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            console.log('Showing quick action popup for:', lat, lng);
            
            // Clear any selection
            this.uiManager.clearSelection();
            
            // Store clicked coordinates for later use
            this.clickedCoordinates = { lat, lng };
            
            // Show quick action popup
            this.uiManager.showQuickActionPopup(lat, lng);
            
            // Zoom to clicked location slightly
            this.mapManager.map.setView([lat, lng], Math.max(this.mapManager.map.getZoom(), 6));
        });
    }

    async loadData() {
        try {
            console.log('Loading data for mode:', this.uiManager.currentMode);
            const mode = this.uiManager.currentMode;
            
            if (mode === 'visited') {
                const locations = await api.getLocations();
                console.log('Loaded locations:', locations);
                this.displayVisitedLocations(locations);
            } else {
                const trips = await api.getTrips();
                console.log('Loaded trips:', trips);
                this.displayPlannedTrips(trips);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Kunne ikke laste data. Sjekk at backend kjører på http://localhost:3000');
        }
    }

    displayVisitedLocations(locations) {
        console.log('Displaying visited locations:', locations);
        
        // Clear existing markers
        this.mapManager.visitedMarkers.forEach((item, id) => {
            this.mapManager.map.removeLayer(item.marker);
        });
        this.mapManager.visitedMarkers.clear();

        // Add new markers
        if (locations && locations.length > 0) {
            locations.forEach(location => {
                console.log('Adding visited location marker:', location);
                this.mapManager.addVisitedLocation(location);
            });
        }

        // Update UI
        this.uiManager.displayLocations(locations || []);
    }

    displayPlannedTrips(trips) {
        console.log('Displaying planned trips:', trips);
        
        // Clear existing markers
        this.mapManager.plannedMarkers.forEach((item, id) => {
            this.mapManager.map.removeLayer(item.marker);
        });
        this.mapManager.plannedMarkers.clear();

        // Add new markers
        if (trips && trips.length > 0) {
            trips.forEach(trip => {
                console.log('Adding planned trip marker:', trip);
                this.mapManager.addPlannedTrip(trip);
            });
        }

        // Update UI
        this.uiManager.displayLocations(trips || []);
    }
}

// Initialize app when DOM is ready
let travelLogApp;
document.addEventListener('DOMContentLoaded', () => {
    travelLogApp = new TravelLogApp();
    // Make app globally available for search functionality
    window.travelLogApp = travelLogApp;
});

