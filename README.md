<div align="center">

# 📊 Thesis Survey

### A Professional Survey Platform for Academic Research

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Flask](https://img.shields.io/badge/Flask-3-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A **mobile-first**, **multilingual** survey platform built for academic thesis data collection. Features a beautiful community portal for respondents, a powerful admin dashboard for researchers, and built-in analytics with data export capabilities.

[Features](#-features) · [Quick Start](#-quick-start) · [Deployment](#-deployment) · [API Reference](#-api-reference) · [Contact](#-contact)

</div>

---

## ✨ Features

### 🌍 Multilingual Support
- **Three languages**: English, Amharic (አማርኛ), and Tigrigna (ትግርኛ)
- Dynamic language switching with persistent preference
- Full UI translation system for all interface elements
- Per-survey translated content (titles, descriptions, and questions)

### 📱 Mobile-First Design
- Responsive layout optimized for smartphones, tablets, and desktops
- Touch-friendly survey interactions
- Safe area support for modern mobile devices
- Animated background with smooth transitions

### 📝 Rich Survey Engine
- **6 question types**: Text, Multiple Choice, Rating, Boolean (Yes/No), Checkbox, and Location (GPS)
- Required/optional question validation
- Real-time form validation and feedback
- Geolocation capture for field research

### 🛡️ Admin Dashboard
- Secure JWT-based authentication
- Create, edit, and delete surveys with a visual builder
- View and analyze responses with interactive charts (Recharts)
- Export survey data to **Excel (XLSX)** for further analysis
- Batch operations on survey responses

### 📊 Analytics & Data Export
- Submission statistics with visual breakdowns
- Response distribution charts per question
- One-click Excel export with formatted spreadsheets
- Timeline-based submission tracking

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │          React 19 + TypeScript + Vite             │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │ Community  │  │    Admin     │  │  Survey   │  │   │
│  │  │  Portal    │  │  Dashboard   │  │  Page     │  │   │
│  │  └────────────┘  └──────────────┘  └──────────┘  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  Tailwind CSS 4 · Shadcn UI · Motion       │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │ REST API                      │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                   Server (Backend)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Flask + Flask-CORS + PyJWT              │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Auth    │  │   Surveys    │  │ Submissions │  │   │
│  │  │  /login  │  │   CRUD API   │  │    API      │  │   │
│  │  └──────────┘  └──────────────┘  └────────────┘  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │              SQLite Database                │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 19, TypeScript 5.8, Vite 6                        |
| Styling    | Tailwind CSS 4, Shadcn UI, Motion (Framer Motion)       |
| Routing    | React Router DOM 7                                      |
| Charts     | Recharts 3                                              |
| Icons      | Lucide React                                            |
| Data Export| SheetJS (xlsx)                                           |
| Backend    | Python Flask, Flask-CORS                                |
| Auth       | PyJWT (JSON Web Tokens)                                 |
| Database   | SQLite (via raw sqlite3)                                |
| Deployment | Netlify (frontend) + PythonAnywhere (backend)           |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.9
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/TsegayDev/Thesis-Survey.git
cd Thesis-Survey
```

### 2. Setup the Backend

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Edit .env and set your admin credentials and JWT secret
```

### 3. Setup the Frontend

```bash
# From the project root
cd ..

# Install Node dependencies
npm install

# Create your .env file
cp .env.example .env
# For local development, leave VITE_API_BASE_URL empty (Vite proxy handles it)
```

### 4. Run the Application

#### Option A: One-Command Start (Windows)

```bash
# From the project root
start_dev.bat
```

This script automatically:
- Checks for Python and npm
- Creates the backend virtual environment if needed
- Installs Python dependencies
- Starts both the Flask backend and Vite dev server

#### Option B: Manual Start

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
python main.py
```
Backend runs on `http://localhost:8000`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Access the App

| URL                          | Description                    |
| ---------------------------- | ------------------------------ |
| `http://localhost:5173`      | Community Portal (public)      |
| `http://localhost:5173/login`| Admin Login                    |
| `http://localhost:5173/admin`| Admin Dashboard (protected)    |
| `http://localhost:5173/survey/:id` | Take a specific survey   |

---

## 📂 Project Structure

```
Thesis-Survey/
│
├── backend/                    # Flask API server
│   ├── main.py                 # Application entry point & all routes
│   ├── models.py               # SQLAlchemy model definitions
│   ├── database.py             # Database configuration
│   ├── wsgi.py                 # WSGI entry for production deployment
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variable template
│
├── src/                        # React frontend source
│   ├── App.tsx                 # Root component with routing
│   ├── main.tsx                # Application entry point
│   ├── index.css               # Global styles (Tailwind base)
│   ├── types.ts                # TypeScript type definitions
│   ├── AuthContext.tsx          # Authentication state management
│   ├── LanguageContext.tsx      # i18n language state management
│   ├── lib/
│   │   └── translations.ts     # UI string translations (EN/AM/TI)
│   ├── pages/
│   │   ├── CommunityPortal.tsx  # Public landing page with survey list
│   │   ├── LoginPage.tsx        # Admin authentication page
│   │   ├── AdminDashboard.tsx   # Protected admin control panel
│   │   └── SurveyPage.tsx       # Public survey-taking page
│   └── components/
│       ├── SurveyCreator.tsx    # Survey builder with question editor
│       ├── SurveyList.tsx       # Survey listing & management
│       ├── SurveyResults.tsx    # Response analytics & export
│       ├── SurveyTaker.tsx      # Survey response form
│       ├── LanguageSwitcher.tsx # Language toggle component
│       └── ProtectedRoute.tsx   # Auth guard for admin routes
│
├── components/ui/              # Shadcn UI component library
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── radio-group.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   └── textarea.tsx
│
├── data/                       # Seed data
│   ├── surveys.json            # Default survey templates
│   └── submissions.json        # Sample submission data
│
├── public/
│   ├── icon.webp               # App favicon
│   └── _redirects              # Netlify SPA routing config
│
├── index.html                  # HTML entry point
├── package.json                # Node.js dependencies & scripts
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── components.json             # Shadcn UI configuration
├── start_dev.bat               # One-click dev environment (Windows)
├── deployment_guide.md         # Detailed deployment instructions
├── .env.example                # Frontend environment template
└── .gitignore
```

---

## 🌐 Deployment

### Frontend → Netlify

1. Push to GitHub (this repo)
2. Connect the repository on [Netlify](https://app.netlify.com)
3. Configure build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Set environment variable:
   - `VITE_API_BASE_URL` = your backend URL (e.g., `https://yourusername.pythonanywhere.com`)

> The `public/_redirects` file is already configured for SPA client-side routing.

### Backend → PythonAnywhere

1. Upload the `backend/` folder to your PythonAnywhere account
2. Create a virtual environment and install dependencies:
   ```bash
   mkvirtualenv --python=/usr/bin/python3.10 thesis-venv
   pip install -r requirements.txt
   ```
3. Configure the WSGI file to point to `main.py`
4. Set environment variables (admin credentials, JWT secret)

> See [deployment_guide.md](deployment_guide.md) for step-by-step instructions.

---

## 📡 API Reference

All API routes are prefixed with `/api`.

### Authentication

| Method | Endpoint         | Description              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| POST   | `/api/auth/login`| Login with admin credentials | ❌ |
| GET    | `/api/auth/me`   | Get current user info    | ✅   |

### Surveys

| Method | Endpoint              | Description              | Auth |
| ------ | --------------------- | ------------------------ | ---- |
| GET    | `/api/surveys`        | List all surveys         | ❌   |
| GET    | `/api/surveys/:id`    | Get a specific survey    | ❌   |
| POST   | `/api/surveys`        | Create a new survey      | ✅   |
| PUT    | `/api/surveys/:id`    | Update a survey          | ✅   |
| DELETE | `/api/surveys/:id`    | Delete a survey          | ✅   |

### Submissions

| Method | Endpoint                          | Description              | Auth |
| ------ | --------------------------------- | ------------------------ | ---- |
| POST   | `/api/submissions`                | Submit a survey response | ❌   |
| GET    | `/api/surveys/:id/submissions`    | Get all submissions      | ✅   |
| DELETE | `/api/surveys/:id/submissions`    | Delete all submissions   | ✅   |

**Authentication:** Include `Authorization: Bearer <token>` header for protected routes.

---

## 🔐 Environment Variables

### Frontend (`.env`)

| Variable            | Description                          | Default |
| ------------------- | ------------------------------------ | ------- |
| `VITE_API_BASE_URL` | Backend API URL (empty for dev proxy)| _(empty)_ |

### Backend (`backend/.env`)

| Variable         | Description                          | Required |
| ---------------- | ------------------------------------ | -------- |
| `ADMIN_EMAIL`    | Admin login email                    | ✅       |
| `ADMIN_PASSWORD` | Admin login password                 | ✅       |
| `JWT_SECRET`     | Secret key for JWT token signing     | ✅       |

---

## 📜 Available Scripts

### Frontend

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start Vite development server  |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview production build       |
| `npm run lint`    | TypeScript type checking       |
| `npm run clean`   | Remove dist directory          |

### Backend

| Command                        | Description                    |
| ------------------------------ | ------------------------------ |
| `python main.py`               | Start Flask development server |
| `gunicorn wsgi:application`    | Start production server        |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**Tsegay Gebrekidan**

- 📧 Email: [tsegaydev@gmail.com](mailto:tsegaydev@gmail.com)
- 📱 Phone: +251 946 351 205
- 🐙 GitHub: [@TsegayDev](https://github.com/TsegayDev)

---

<div align="center">

Made with ❤️ for academic research

</div>
