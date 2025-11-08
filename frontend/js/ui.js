// UI management class
class UIManager {
    constructor() {
        this.currentMode = 'visited'; // 'visited' or 'planned'
        this.currentLocations = [];
        this.selectedLocation = null;
        this.pendingCoordinates = null;
        this.init();
    }

    init() {
        // Mode buttons
        document.getElementById('visited-mode').addEventListener('click', () => {
            this.setMode('visited');
        });

        document.getElementById('planned-mode').addEventListener('click', () => {
            this.setMode('planned');
        });

        // View toggle buttons (list/timeline)
        document.getElementById('list-view-btn').addEventListener('click', () => {
            this.switchView('list');
        });

        document.getElementById('timeline-view-btn').addEventListener('click', () => {
            this.switchView('timeline');
        });

        // Action buttons
        document.getElementById('clear-selection-btn').addEventListener('click', () => {
            this.clearSelection();
        });

        // Search functionality
        const searchInput = document.getElementById('city-search');
        const searchBtn = document.getElementById('search-btn');
        const searchResults = document.getElementById('search-results');
        
        let searchTimeout = null;
        
        // Search on button click
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });
        
        // Real-time search as user types (with debounce)
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.classList.remove('show');
                return;
            }
            
            // Debounce: wait 500ms after user stops typing
            searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 500);
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && 
                !searchBtn.contains(e.target) && 
                !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });

        // Modal
        const modal = document.getElementById('location-modal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');

        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submitted');
            this.handleFormSubmit();
        });

        // Listen for marker selection
        window.addEventListener('markerSelected', (e) => {
            this.selectLocation(e.detail.data, e.detail.type);
        });

        // Quick action popup buttons - use event delegation since buttons might not exist yet
        const quickActionPopup = document.getElementById('quick-action-popup');
        if (quickActionPopup) {
            quickActionPopup.addEventListener('click', (e) => {
                const btn = e.target.closest('.quick-action-btn');
                if (btn) {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    console.log('Quick action button clicked:', action);
                    this.handleQuickAction(action);
                } else if (e.target === quickActionPopup) {
                    // Close popup when clicking outside (on the backdrop)
                    this.hideQuickActionPopup();
                }
            });
        } else {
            console.error('Quick action popup not found during init!');
        }
    }

    showQuickActionPopup(lat, lng, name = null) {
        console.log('showQuickActionPopup called with:', lat, lng, name);
        const popup = document.getElementById('quick-action-popup');
        if (!popup) {
            console.error('Quick action popup element not found!');
            return;
        }
        console.log('Adding show class to popup');
        // Store coordinates and name BEFORE showing popup to ensure they're available
        this.pendingCoordinates = { 
            lat: parseFloat(lat), 
            lng: parseFloat(lng),
            name: name || null
        };
        console.log('Stored pendingCoordinates:', this.pendingCoordinates);
        popup.classList.add('show');
        console.log('Popup should be visible now');
    }

    hideQuickActionPopup() {
        const popup = document.getElementById('quick-action-popup');
        if (popup) {
            popup.classList.remove('show');
        }
        // Don't clear pendingCoordinates here - we need them in handleQuickAction
        // They will be cleared after successful processing
    }

    async handleQuickAction(action) {
        console.log('handleQuickAction called with action:', action);
        console.log('Pending coordinates BEFORE hide:', this.pendingCoordinates);
        
        // Store coordinates and name BEFORE hiding popup
        const coords = this.pendingCoordinates ? { ...this.pendingCoordinates } : null;
        
        if (action === 'cancel') {
            console.log('Action cancelled');
            this.hideQuickActionPopup();
            this.pendingCoordinates = null;
            return;
        }
        
        if (!coords || !coords.lat || !coords.lng) {
            console.error('No pending coordinates!', coords);
            this.hideQuickActionPopup();
            alert('Ingen koordinater funnet. Prøv å klikke på kartet igjen.');
            return;
        }
        
        // Hide popup now that we have coordinates
        this.hideQuickActionPopup();
        
        const { lat, lng, name } = coords;
        console.log('Processing action with coordinates:', lat, lng, 'and name:', name);
        
        // Pre-fill form with clicked coordinates
        const latInput = document.getElementById('location-lat');
        const lngInput = document.getElementById('location-lng');
        
        if (!latInput || !lngInput) {
            console.error('Location input fields not found!');
            alert('Kunne ikke finne skjema-felter. Last siden på nytt.');
            return;
        }
        
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        console.log('Coordinates set in form:', latInput.value, lngInput.value);
        
        // Set mode based on action
        if (action === 'visited') {
            console.log('Setting mode to visited');
            this.setMode('visited');
        } else if (action === 'planned') {
            console.log('Setting mode to planned');
            this.setMode('planned');
        }
        
        // Open modal first
        console.log('Opening add modal');
        this.openAddModal();
        
        // Wait a bit for modal to be fully rendered
        setTimeout(async () => {
            const nameInput = document.getElementById('location-name');
            if (!nameInput) {
                console.error('Name input field not found!');
                return;
            }
            
            // If we already have a name from search, use it directly
            if (name && name.trim()) {
                console.log('Using provided name from search:', name);
                nameInput.value = name;
                nameInput.disabled = false;
                this.pendingCoordinates = null;
                setTimeout(() => {
                    nameInput.focus();
                }, 300);
                return;
            }
            
            // Otherwise, fetch location name using geocoding
            nameInput.value = 'Loading...';
            nameInput.disabled = true;
        
            try {
                console.log('Fetching location name for:', lat, lng);
                const locationName = await geocoding.getLocationName(lat, lng);
                console.log('Received location name:', locationName);
                
                // Wait a bit more to ensure modal is fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Update the input field - try multiple times to ensure it works
                let attempts = 0;
                const maxAttempts = 5;
                while (attempts < maxAttempts) {
                    const currentNameInput = document.getElementById('location-name');
                    if (currentNameInput) {
                        if (locationName && locationName !== 'Unknown Location' && locationName !== null) {
                            currentNameInput.value = locationName;
                            console.log('Set location name to:', locationName);
                            currentNameInput.disabled = false;
                            break;
                        } else {
                            currentNameInput.value = '';
                            currentNameInput.placeholder = 'Skriv inn stedsnavn';
                            console.log('No valid location name received');
                            currentNameInput.disabled = false;
                            break;
                        }
                    } else {
                        attempts++;
                        console.log(`Name input not found, attempt ${attempts}/${maxAttempts}`);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            } catch (error) {
                console.error('Error fetching location name:', error);
                const currentNameInput = document.getElementById('location-name');
                if (currentNameInput) {
                    currentNameInput.value = '';
                    currentNameInput.placeholder = 'Skriv inn stedsnavn';
                    currentNameInput.disabled = false;
                }
            } finally {
                // Clear pending coordinates after processing
                this.pendingCoordinates = null;
                const currentNameInput = document.getElementById('location-name');
                if (currentNameInput) {
                    setTimeout(() => {
                        currentNameInput.focus();
                    }, 300);
                }
            }
        }, 200);
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.getElementById('visited-mode').classList.toggle('active', mode === 'visited');
        document.getElementById('planned-mode').classList.toggle('active', mode === 'planned');

        // Update sidebar title
        const title = document.getElementById('sidebar-title');
        title.textContent = mode === 'visited' ? 'Besøkte steder' : 'Planlagte reiser';

        // Trigger mode change event
        window.dispatchEvent(new CustomEvent('modeChanged', { detail: { mode } }));
    }

    displayLocations(locations) {
        this.currentLocations = locations;
        
        // Update statistics
        this.updateStatistics(locations);
        
        // Check current view mode
        const listViewBtn = document.getElementById('list-view-btn');
        const isListView = listViewBtn.classList.contains('active');
        
        if (isListView) {
            this.displayListView(locations);
        } else {
            this.displayTimelineView(locations);
        }
    }

    displayListView(locations) {
        const listContainer = document.getElementById('locations-list');
        const timelineContainer = document.getElementById('timeline-view');
        
        // Hide timeline, show list
        timelineContainer.style.display = 'none';
        listContainer.style.display = 'flex';
        
        if (locations.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Ingen ${this.currentMode === 'visited' ? 'besøkte steder' : 'planlagte reiser'} ennå.</p>
                    <p>Klikk på kartet for å legge til pins!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = locations.map(location => {
            const date = this.currentMode === 'visited' ? location.visited_date : location.planned_date;
            const year = date ? new Date(date).getFullYear() : null;
            const formattedDate = date ? this.formatDate(date) : null;
            
            return `
                <div class="location-item" data-id="${location.id}">
                    <h3>
                        ${location.name}
                        ${year ? `<span class="location-year">${year}</span>` : ''}
                    </h3>
                    ${formattedDate ? `<div class="location-date">📅 ${formattedDate}</div>` : ''}
                    <p class="location-coords">📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
                    ${location.notes ? `<p>${location.notes}</p>` : ''}
                    <div class="location-actions">
                        <button class="btn btn-secondary edit-btn" data-id="${location.id}">Rediger</button>
                        <button class="btn btn-danger delete-btn" data-id="${location.id}">Slett</button>
                    </div>
                </div>
            `;
        }).join('');

        this.attachLocationEventListeners(locations, listContainer);
    }

    displayTimelineView(locations) {
        const listContainer = document.getElementById('locations-list');
        const timelineContainer = document.getElementById('timeline-view');
        
        // Hide list, show timeline
        listContainer.style.display = 'none';
        timelineContainer.style.display = 'flex';
        
        if (locations.length === 0) {
            timelineContainer.innerHTML = `
                <div class="timeline-empty">
                    <p>Ingen ${this.currentMode === 'visited' ? 'besøkte steder' : 'planlagte reiser'} ennå.</p>
                    <p>Klikk på kartet for å legge til pins!</p>
                </div>
            `;
            return;
        }

        // Group locations by year
        const groupedByYear = this.groupLocationsByYear(locations);
        
        // Sort years descending (newest first)
        const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));
        
        timelineContainer.innerHTML = sortedYears.map(year => {
            const yearLocations = groupedByYear[year];
            // Sort locations within year by date (newest first)
            yearLocations.sort((a, b) => {
                const dateA = this.currentMode === 'visited' ? a.visited_date : a.planned_date;
                const dateB = this.currentMode === 'visited' ? b.visited_date : b.planned_date;
                return new Date(dateB) - new Date(dateA);
            });
            
            return `
                <div class="timeline-year-group">
                    <div class="timeline-year-header">${year}</div>
                    <div class="timeline-locations">
                        ${yearLocations.map(location => {
                            const date = this.currentMode === 'visited' ? location.visited_date : location.planned_date;
                            const formattedDate = date ? this.formatDate(date) : null;
                            
                            return `
                                <div class="timeline-location-item" data-id="${location.id}">
                                    <h4>${location.name}</h4>
                                    ${formattedDate ? `<div class="timeline-date">📅 ${formattedDate}</div>` : ''}
                                    ${location.notes ? `<div class="timeline-notes">${location.notes}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners to timeline items
        timelineContainer.querySelectorAll('.timeline-location-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = parseInt(item.dataset.id);
                const location = locations.find(l => l.id === id);
                if (location) {
                    this.selectLocation(location, this.currentMode);
                }
            });
        });
    }

    groupLocationsByYear(locations) {
        const grouped = {};
        
        locations.forEach(location => {
            const date = this.currentMode === 'visited' ? location.visited_date : location.planned_date;
            const year = date ? new Date(date).getFullYear() : 'Ingen dato';
            
            if (!grouped[year]) {
                grouped[year] = [];
            }
            grouped[year].push(location);
        });
        
        return grouped;
    }

    formatDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            // Format as "DD. MMM YYYY" (e.g., "15. Jan 2024")
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day}. ${month} ${year}`;
        } catch (e) {
            return dateString; // Return original if parsing fails
        }
    }

    switchView(view) {
        const listViewBtn = document.getElementById('list-view-btn');
        const timelineViewBtn = document.getElementById('timeline-view-btn');
        
        if (view === 'list') {
            listViewBtn.classList.add('active');
            timelineViewBtn.classList.remove('active');
            this.displayListView(this.currentLocations || []);
        } else {
            timelineViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            this.displayTimelineView(this.currentLocations || []);
        }
    }

    attachLocationEventListeners(locations, container) {
        // Add event listeners
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                const location = locations.find(l => l.id === id);
                this.openEditModal(location);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.target.dataset.id);
                this.deleteLocation(id);
            });
        });

        container.querySelectorAll('.location-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn')) return;
                const id = parseInt(item.dataset.id);
                const location = locations.find(l => l.id === id);
                this.selectLocation(location, this.currentMode);
            });
        });
    }

    async updateStatistics(locations) {
        // Get all visited locations and planned trips for statistics
        try {
            const [visitedLocations, plannedTrips] = await Promise.all([
                api.getLocations(),
                api.getTrips()
            ]);

            // Count visited locations
            const visitedCount = visitedLocations.length;
            document.getElementById('stat-visited-count').textContent = visitedCount;

            // Count planned trips
            const plannedCount = plannedTrips.length;
            document.getElementById('stat-planned-count').textContent = plannedCount;

            // Count unique countries (extract from location names)
            const countries = new Set();
            visitedLocations.forEach(location => {
                // Try to extract country from name (format: "City, Country")
                const parts = location.name.split(',').map(s => s.trim());
                if (parts.length > 1) {
                    countries.add(parts[parts.length - 1]);
                } else {
                    // If no comma, might be just a city, try to get country from geocoding
                    // For now, we'll count unique location names as a proxy
                    countries.add(location.name);
                }
            });
            
            // For a better country count, we'd need to store country separately or use reverse geocoding
            // For now, use a simple heuristic: count unique last parts of location names
            const countryCount = countries.size;
            document.getElementById('stat-countries-count').textContent = countryCount;
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    selectLocation(location, type) {
        // Update selected state
        document.querySelectorAll('.location-item').forEach(item => {
            item.classList.remove('selected');
            if (parseInt(item.dataset.id) === location.id) {
                item.classList.add('selected');
            }
        });

        this.selectedLocation = location;
        
        // Trigger selection event
        window.dispatchEvent(new CustomEvent('locationSelected', {
            detail: { location, type }
        }));
    }

    clearSelection() {
        this.selectedLocation = null;
        document.querySelectorAll('.location-item').forEach(item => {
            item.classList.remove('selected');
        });
        window.dispatchEvent(new CustomEvent('selectionCleared'));
    }

    openAddModal() {
        const modal = document.getElementById('location-modal');
        const form = document.getElementById('location-form');
        const title = document.getElementById('modal-title');
        
        title.textContent = `Legg til ${this.currentMode === 'visited' ? 'besøkt sted' : 'planlagt reise'}`;
        
        // Don't reset form if coordinates are already filled (from map click)
        const latInput = document.getElementById('location-lat');
        const lngInput = document.getElementById('location-lng');
        const nameInput = document.getElementById('location-name');
        
        if (!latInput.value || !lngInput.value) {
            // If no coordinates, reset form completely
            form.reset();
            document.getElementById('location-id').value = '';
            nameInput.placeholder = 'Skriv inn stedsnavn';
        } else {
            // Only reset ID, keep coordinates
            document.getElementById('location-id').value = '';
            // Don't clear name if it's being loaded
            if (nameInput.value !== 'Loading...') {
                nameInput.value = '';
            }
        }
        
        // Set date field label
        const dateLabel = document.querySelector('label[for="location-date"]');
        if (dateLabel) {
            dateLabel.textContent = this.currentMode === 'visited' ? 'Besøksdato:' : 'Planlagt dato:';
        }
        
        modal.classList.add('show');
    }

    openEditModal(location) {
        const modal = document.getElementById('location-modal');
        const form = document.getElementById('location-form');
        const title = document.getElementById('modal-title');
        
        title.textContent = `Rediger ${this.currentMode === 'visited' ? 'besøkt sted' : 'planlagt reise'}`;
        
        document.getElementById('location-id').value = location.id;
        document.getElementById('location-name').value = location.name;
        document.getElementById('location-lat').value = location.latitude;
        document.getElementById('location-lng').value = location.longitude;
        document.getElementById('location-date').value = this.currentMode === 'visited' 
            ? (location.visited_date || '') 
            : (location.planned_date || '');
        document.getElementById('location-notes').value = location.notes || '';
        
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('location-modal');
        modal.classList.remove('show');
    }

    async handleFormSubmit() {
        const form = document.getElementById('location-form');
        const id = document.getElementById('location-id').value;
        
        // Get form values
        const name = document.getElementById('location-name').value.trim();
        const latStr = document.getElementById('location-lat').value;
        const lngStr = document.getElementById('location-lng').value;
        const notes = document.getElementById('location-notes').value.trim();
        
        // Validate
        if (!name) {
            alert('Vennligst skriv inn et stedsnavn');
            return;
        }
        
        if (!latStr || !lngStr) {
            alert('Koordinater mangler. Vennligst klikk på kartet eller fyll inn koordinater manuelt.');
            return;
        }
        
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lngStr);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            alert('Ugyldige koordinater. Vennligst sjekk at bredde- og lengdegrad er gyldige tall.');
            return;
        }
        
        const data = {
            name: name,
            latitude: latitude,
            longitude: longitude,
            notes: notes || null
        };

        if (this.currentMode === 'visited') {
            data.visited_date = document.getElementById('location-date').value || null;
        } else {
            data.planned_date = document.getElementById('location-date').value || null;
        }

        console.log('Lagrer data:', data);
        
        // Show loading state
        const submitBtn = document.querySelector('#location-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Lagrer...';
        
        try {
            let result;
            if (id) {
                // Update existing
                console.log('Oppdaterer eksisterende sted med ID:', id);
                if (this.currentMode === 'visited') {
                    result = await api.updateLocation(id, data);
                } else {
                    result = await api.updateTrip(id, data);
                }
            } else {
                // Create new
                console.log('Oppretter nytt sted');
                if (this.currentMode === 'visited') {
                    result = await api.createLocation(data);
                } else {
                    result = await api.createTrip(data);
                }
            }
            
            console.log('Lagring vellykket:', result);
            this.closeModal();
            
            // Force reload data to show new pin
            window.dispatchEvent(new CustomEvent('dataChanged'));
            
            // Also trigger a manual reload after a short delay to ensure backend has processed
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('dataChanged'));
            }, 500);
            
        } catch (error) {
            console.error('Feil ved lagring:', error);
            alert('Feil ved lagring: ' + (error.message || 'Ukjent feil. Sjekk konsollen for detaljer.'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('city-search');
        const searchResults = document.getElementById('search-results');
        const query = searchInput.value.trim();
        
        if (!query || query.length < 2) {
            searchResults.classList.remove('show');
            return;
        }
        
        searchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Søker...</div>';
        searchResults.classList.add('show');
        
        try {
            const results = await geocoding.searchLocation(query);
            
            if (results.length === 0) {
                searchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Ingen resultater funnet</div>';
                return;
            }
            
            searchResults.innerHTML = results.map(result => `
                <div class="search-result-item" data-lat="${result.latitude}" data-lng="${result.longitude}" data-name="${result.name}">
                    <div class="result-name">${result.name}</div>
                    <div class="result-details">${result.displayName}</div>
                </div>
            `).join('');
            
            // Add click listeners to results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lat = parseFloat(item.dataset.lat);
                    const lng = parseFloat(item.dataset.lng);
                    const name = item.dataset.name;
                    
                    console.log('Selected location from search:', name, lat, lng);
                    
                    // Close search results
                    searchResults.classList.remove('show');
                    searchInput.value = '';
                    
                    // Zoom to location
                    window.travelLogApp.mapManager.map.setView([lat, lng], 10);
                    
                    // Show quick action popup with the name from search
                    this.showQuickActionPopup(lat, lng, name);
                });
            });
            
        } catch (error) {
            console.error('Search error:', error);
            console.error('Error stack:', error.stack);
            let errorMessage = 'Feil ved søk. Prøv igjen.';
            if (error) {
                const errorMsg = error.message || error.toString() || 'Unknown error';
                console.log('Error message:', errorMsg);
                if (errorMsg.includes('429')) {
                    errorMessage = 'For mange søk. Vennligst vent litt før du prøver igjen.';
                } else if (errorMsg.includes('timeout')) {
                    errorMessage = 'Søket tok for lang tid. Prøv igjen.';
                } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
                    errorMessage = 'Kunne ikke koble til server. Sjekk at backend kjører.';
                } else if (errorMsg !== 'Unknown error') {
                    errorMessage = `Feil ved søk: ${errorMsg}`;
                }
            }
            searchResults.innerHTML = `<div style="padding: 15px; text-align: center; color: #dc3545;">${errorMessage}</div>`;
        }
    }

    async deleteLocation(id) {
        if (!confirm('Er du sikker på at du vil slette dette stedet?')) {
            return;
        }

        try {
            if (this.currentMode === 'visited') {
                await api.deleteLocation(id);
            } else {
                await api.deleteTrip(id);
            }
            window.dispatchEvent(new CustomEvent('dataChanged'));
        } catch (error) {
            alert('Feil ved sletting: ' + error.message);
        }
    }
}

