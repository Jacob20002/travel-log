// Map management class
class MapManager {
    constructor(containerId) {
        this.map = L.map(containerId).setView(MAP_CONFIG.defaultCenter, MAP_CONFIG.defaultZoom);
        this.visitedMarkers = new Map();
        this.plannedMarkers = new Map();
        this.selectedMarker = null;
        
        // Initialize map tiles - using multiple layers for best English label support
        // Primary: OpenStreetMap (standard, but may show local names)
        // We'll use OSM but rely on geocoding for English names in our app
        
        // Option 1: Standard OSM (shows local names on map, but our geocoding gives English)
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
        
        // Option 2: CartoDB Positron (cleaner, but may still have some local names)
        const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        });
        
        // Use OSM as default (more detailed)
        osmLayer.addTo(this.map);
        
        // Store layers for potential switching
        this.baseLayers = {
            'OpenStreetMap': osmLayer,
            'CartoDB Light': cartoLayer
        };

        // Force map to resize after a short delay to ensure container is properly sized
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);

        // Create custom icons
        this.visitedIcon = L.divIcon({
            className: 'custom-marker visited-marker',
            html: '<div style="background-color: ' + MAP_CONFIG.visitedIconColor + '; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        this.plannedIcon = L.divIcon({
            className: 'custom-marker planned-marker',
            html: '<div style="background-color: ' + MAP_CONFIG.plannedIconColor + '; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
    }

    addVisitedLocation(location) {
        const marker = L.marker([location.latitude, location.longitude], {
            icon: this.visitedIcon
        }).addTo(this.map);

        marker.bindPopup(`
            <strong>${location.name}</strong><br>
            ${location.visited_date ? 'Dato: ' + location.visited_date : ''}<br>
            ${location.notes ? 'Notater: ' + location.notes : ''}
        `);

        marker.on('click', () => {
            this.selectMarker(marker, location, 'visited');
        });

        this.visitedMarkers.set(location.id, { marker, location });
        return marker;
    }

    addPlannedTrip(trip) {
        const marker = L.marker([trip.latitude, trip.longitude], {
            icon: this.plannedIcon
        }).addTo(this.map);

        marker.bindPopup(`
            <strong>${trip.name}</strong><br>
            ${trip.planned_date ? 'Planlagt dato: ' + trip.planned_date : ''}<br>
            ${trip.notes ? 'Notater: ' + trip.notes : ''}
        `);

        marker.on('click', () => {
            this.selectMarker(marker, trip, 'planned');
        });

        this.plannedMarkers.set(trip.id, { marker, location: trip });
        return marker;
    }

    selectMarker(marker, data, type) {
        // Remove previous selection
        if (this.selectedMarker) {
            this.selectedMarker.setStyle({});
        }

        this.selectedMarker = marker;
        marker.openPopup();
        
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('markerSelected', {
            detail: { data, type }
        }));
    }

    removeVisitedLocation(id) {
        const item = this.visitedMarkers.get(id);
        if (item) {
            this.map.removeLayer(item.marker);
            this.visitedMarkers.delete(id);
        }
    }

    removePlannedTrip(id) {
        const item = this.plannedMarkers.get(id);
        if (item) {
            this.map.removeLayer(item.marker);
            this.plannedMarkers.delete(id);
        }
    }

    clearSelection() {
        if (this.selectedMarker) {
            this.selectedMarker.closePopup();
            this.selectedMarker = null;
        }
    }

    getMap() {
        return this.map;
    }

    getCurrentCenter() {
        return this.map.getCenter();
    }

    getCurrentZoom() {
        return this.map.getZoom();
    }
}

