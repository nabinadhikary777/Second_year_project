# SawariSewa - Vehicle Rental System

How to run the project (backend + frontend).

---

## Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 16+** and **npm** (for frontend)
- **SQLite** (used by default; no extra setup)

---

## 1. Backend (Django)

### First-time setup

```powershell
cd backend

# Create and activate virtual environment (if not already done)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers djangorestframework-authtoken django-allauth dj-rest-auth requests Pillow

# Run migrations
python manage.py migrate

# Create a superuser (optional, for Django admin at http://localhost:8000/admin/)
python manage.py createsuperuser
```

### Run the backend server

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

- API base: **http://localhost:8000/api/auth/**
- Admin: **http://localhost:8000/admin/**

Keep this terminal open.

---

## 2. Frontend (React)

### First-time setup

```powershell
cd frontend
npm install
```

### Run the frontend

```powershell
cd frontend
npm start
```

- App opens at **http://localhost:3000**

---

## 3. Run both together

1. **Terminal 1 – Backend**
   ```powershell
   cd c:\Users\DIPEN\Desktop\Final-project\Development\backend
   .\venv\Scripts\activate
   python manage.py runserver
   ```

2. **Terminal 2 – Frontend**
   ```powershell
   cd c:\Users\DIPEN\Desktop\Final-project\Development\frontend
   npm start
   ```

3. Open **http://localhost:3000** in your browser.

---

## Demo login (if you have seed data)

- **Customer:** `customer` / `password123`
- **Owner:** `owner` / `password123`

If these users don’t exist, register from the app or create them via Django admin.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `ModuleNotFoundError` | Activate venv and run `pip install django djangorestframework django-cors-headers djangorestframework-authtoken django-allauth dj-rest-auth requests Pillow` |
| Frontend can’t reach API | Ensure backend is running on port 8000. In `frontend/src/services/api.js`, `API_URL` is `http://localhost:8000/api/auth/`. |
| CORS errors | Backend uses `corsheaders`; with `DEBUG=True` it should allow `localhost:3000`. |
| Migrations | From `backend`: `python manage.py migrate` |
