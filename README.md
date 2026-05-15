# SIALICO Frontend

This is the official Angular 17 frontend for SIALICO, a regulatory SaaS platform.

## Tech Stack
- Angular 17 (Standalone Components)
- TypeScript
- RxJS
- HTML5 / Vanilla CSS with custom design system

## Setup Instructions

**Important:** Ensure you do not use old or copied `node_modules`.

1. Ensure you have Node.js and NPM installed.
2. Clone this repository.
3. Install dependencies from a clean state:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:4200/`.

## Backend API URL
The application is configured to connect to the Django backend running locally at `http://127.0.0.1:8000/api`.
Ensure the backend is running.

## Demo Credentials
Use these credentials to log in and test the features:

**Client (PRO Anual)**: `client@sialico.com` / `Sialico123!`
**Admin**: `admin@sialico.com` / `Admin123!`
**Consultant**: `consultant@sialico.com` / `Consultant123!`

## Main Routes
- `/login` - Auth gateway
- `/register` - Account creation
- `/onboarding` - Initial company setup
- `/dashboard` - Summary of activity
- `/projects` - Project management and lists
- `/subscription` - Billing and plan details
- `/notifications` - Platform alerts
- `/guides` - Help and tutorials
- `/support` - Ticketing via Chatbot
- `/profile` - User settings

## Full-Stack Run Instructions

To run both applications simultaneously, open two terminals.

**Terminal 1 (Backend):**
```bash
cd Backend-SIALICO
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd Frontend-SIALICO
npm install
npm start
```
Then navigate to `http://localhost:4200` in your browser.

## Troubleshooting
- **401 Unauthorized**: Ensure your backend is running and you have valid credentials.
- **CORS Errors**: Ensure `CORS_ALLOW_ALL_ORIGINS` is enabled in the Django backend for local development.
- **Data not showing**: Run `python manage.py seed_sialico` on the backend to populate the database.
