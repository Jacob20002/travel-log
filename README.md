# 🌍 Travel Log - Reiselogg

En webapplikasjon for å logge besøkte steder og planlegge fremtidige reiser med interaktivt kart.

## Funksjoner

- 🗺️ Interaktivt kart med OpenStreetMap
- ✅ Marker besøkte steder på kartet
- 📅 Planlegg fremtidige reiser
- 📝 Legg til notater og datoer for hvert sted
- 🐳 Docker containerisering for enkel deployering

## Prosjektstruktur

```
travel_log/
├── backend/
│   ├── database/
│   │   └── db.js          # Database initialisering og konfigurasjon
│   ├── routes/
│   │   ├── locations.js   # API routes for besøkte steder
│   │   └── trips.js       # API routes for planlagte reiser
│   ├── data/              # SQLite database lagres her
│   ├── Dockerfile
│   ├── package.json
│   └── server.js          # Express server
├── frontend/
│   ├── css/
│   │   └── styles.css     # Styling
│   ├── js/
│   │   ├── app.js         # Hovedapplikasjon
│   │   ├── api.js         # API kommunikasjon
│   │   ├── config.js      # Konfigurasjon
│   │   ├── map.js         # Kart-håndtering
│   │   └── ui.js          # UI-håndtering
│   ├── Dockerfile
│   └── index.html         # Hovedside
├── docker-compose.yml     # Docker Compose konfigurasjon
└── README.md
```

## Komme i gang

### Forutsetninger

- Docker og Docker Compose installert
- Git (for å klone repositoriet)

### Installasjon og kjøring

1. **Klon repositoryet:**
   ```bash
   git clone https://github.com/Jacob20002/travel-log.git
   cd travel-log
   ```

2. **Bygg og start containere:**
   ```bash
   docker-compose up -d --build
   ```

3. **Åpne nettleseren:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000/api/health

### Oppdatere fra GitHub

Hvis du har gjort endringer på en annen maskin og vil hente dem:

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Pushe endringer til GitHub

```bash
git add .
git commit -m "Beskrivelse av endringene"
git push origin main
```

### Utvikling

For å utvikle lokalt uten Docker:

#### Backend:
```bash
cd backend
npm install
npm start
```

#### Frontend:
Åpne `frontend/index.html` i en nettleser, eller bruk en lokal server:
```bash
cd frontend
python -m http.server 8000
```

**Merk:** Hvis du kjører frontend lokalt, må du oppdatere `frontend/js/config.js` med riktig API URL.

## Bruk

1. **Legge til besøkt sted:**
   - Klikk på "Besøkte steder" modus
   - **Klikk direkte på kartet** der du har vært (koordinatene fylles automatisk!)
   - Eller klikk "Legg til sted manuelt" for å legge inn koordinater manuelt
   - Fyll inn stedsnavn, dato og notater, deretter lagre

2. **Planlegge reise:**
   - Klikk på "Planlagte reiser" modus
   - **Klikk direkte på kartet** der du vil reise (koordinatene fylles automatisk!)
   - Eller klikk "Legg til sted manuelt" for å legge inn koordinater manuelt
   - Fyll inn stedsnavn, planlagt dato og notater, deretter lagre

3. **Se og redigere:**
   - Klikk på en pin (markør) på kartet eller et element i listen
   - Rediger eller slett via knappene i listen
   - Alle pins oppdateres automatisk på kartet når du lagrer endringer

**Tips:** Koordinatene (lengde- og breddegrad) fylles automatisk når du klikker på kartet. Du trenger ikke å forstå hva de betyr - bare klikk der du vil legge til en pin!

## Teknologier

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Leaflet.js
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Containerisering:** Docker, Docker Compose
- **Web Server:** Nginx (for frontend)

## API Endpoints

### Besøkte steder (`/api/locations`)
- `GET /api/locations` - Hent alle besøkte steder
- `GET /api/locations/:id` - Hent spesifikt sted
- `POST /api/locations` - Legg til nytt sted
- `PUT /api/locations/:id` - Oppdater sted
- `DELETE /api/locations/:id` - Slett sted

### Planlagte reiser (`/api/trips`)
- `GET /api/trips` - Hent alle planlagte reiser
- `GET /api/trips/:id` - Hent spesifikk reise
- `POST /api/trips` - Legg til ny reise
- `PUT /api/trips/:id` - Oppdater reise
- `DELETE /api/trips/:id` - Slett reise

## Database

SQLite-databasen lagres i `backend/data/travel_log.db`. Den opprettes automatisk ved første kjøring.

**Viktig om datalagring:**
- Alle pins, besøkte steder og planlagte reiser lagres permanent i databasen
- Dataene bevares selv om du kjører `docker compose down` og `docker compose up` på nytt
- Databasen lagres i `backend/data/` mappen på din maskin (ikke i containeren)
- Dette betyr at alle endringene dine er trygt lagret og vil være der neste gang du starter applikasjonen

## Lisens

ISC

