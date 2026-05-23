# Deployment Guide: Thesis Survey App

This guide will help you deploy your application to production.

## 1. Backend Deployment (PythonAnywhere)

PythonAnywhere is great for hosting Flask apps.

### Steps:
1.  **Upload Code:** Upload the `backend/` folder to your PythonAnywhere account (e.g., in `/home/yourusername/thesis-survey/backend`).
2.  **Create Virtualenv:**
    -   Open a Bash console and run:
        ```bash
        mkvirtualenv --python=/usr/bin/python3.10 thesis-venv
        pip install -r /home/yourusername/thesis-survey/backend/requirements.txt
        ```
3.  **Configure Web App:**
    -   Go to the "Web" tab.
    -   Click "Add a new web app".
    -   Select "Manual Configuration" and choose your Python version.
    -   **Virtualenv:** Set the path to your new virtualenv (e.g., `/home/yourusername/.virtualenvs/thesis-venv`).
    -   **Code:** Set the source code path to your `backend/` folder.
    -   **WSGI configuration file:** Click the link to edit the WSGI file. Replace everything with:
        ```python
        import os
        import sys

        # Add your project directory to the sys.path
        project_home = '/home/yourusername/thesis-survey/backend'
        if project_home not in sys.path:
            sys.path.insert(0, project_home)

        from main import app as application
        ```
4.  **Environment Variables:**
    -   Since PythonAnywhere doesn't easily read `.env` in the web UI, you should set them in the "WSGI Configuration File" at the very top:
        ```python
        os.environ['ADMIN_EMAIL'] = 'tsegaydev@gmail.com'
        os.environ['ADMIN_PASSWORD'] = 'wedihintu@2A'
        os.environ['JWT_SECRET'] = 'your-secret-key-here'
        ```
5.  **CORS:**
    -   In `backend/main.py`, the current setup allows all origins (`*`). This will work, but for better security, you can change it to your Netlify URL once it's ready.

---

## 2. Frontend Deployment (Netlify)

Netlify is perfect for hosting the React/Vite frontend.

### Steps:
1.  **Build Locally (Optional):** You can test the build locally using `npm run build`.
2.  **Upload to GitHub:** Push your code to a GitHub repository.
3.  **Create New Site:**
    -   In Netlify, click "Add new site" > "Import an existing project".
    -   Connect your GitHub.
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `dist`
4.  **Environment Variables:**
    -   Go to **Site settings** > **Environment variables**.
    -   Add `VITE_API_BASE_URL`: Set this to your PythonAnywhere URL (e.g., `https://yourusername.pythonanywhere.com`).
5.  **SPA Routing:**
    -   I've already added the `public/_redirects` file. Netlify will use this to ensure your app doesn't break when you refresh the page.

---

## 3. Important Notes
-   **HTTPS:** Both PythonAnywhere and Netlify provide HTTPS by default. Make sure your `VITE_API_BASE_URL` starts with `https://`.
-   **Database:** The `app.db` (SQLite) will be created in your PythonAnywhere folder. If you want to keep your local data, upload the `app.db` file from your local `backend/` folder.
-   **Security:** Ensure you change the `JWT_SECRET` in production to something unique and long.
