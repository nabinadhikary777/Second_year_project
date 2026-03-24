<<<<<<< HEAD
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
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
>>>>>>> bba3f506170520f6f5fb81c0032ae81cd6ad14d9
