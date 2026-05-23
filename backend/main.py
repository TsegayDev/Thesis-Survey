import uuid
import json
import sqlite3
import os
from functools import wraps
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from pydantic import BaseModel, ValidationError
import jwt
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS surveys (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            questions TEXT NOT NULL,
            translations TEXT,
            createdAt TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            surveyId TEXT NOT NULL,
            answers TEXT NOT NULL,
            submittedAt TEXT NOT NULL
        )
    ''')
    
    # Check if empty
    c.execute('SELECT COUNT(*) FROM surveys')
    if c.fetchone()[0] == 0:
        # Seed from JSON
        data_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "surveys.json")
        try:
            if os.path.exists(data_file):
                with open(data_file, "r", encoding="utf-8") as f:
                    surveys_data = json.loads(f.read())
                    if surveys_data:
                        for s in surveys_data:
                            c.execute('''
                                INSERT INTO surveys (id, title, description, questions, translations, createdAt)
                                VALUES (?, ?, ?, ?, ?, ?)
                            ''', (
                                s.get("id", str(uuid.uuid4())),
                                s["title"],
                                s["description"],
                                json.dumps(s.get("questions", [])),
                                json.dumps(s.get("translations", {})),
                                s.get("createdAt", datetime.now().isoformat())
                            ))
                        conn.commit()
        except BaseException as e:
            print("Seed failed:", e)
    conn.close()

# Initialize DB on startup
init_db()

# ── Auth ────────────────────────────────────────────────

def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"detail": "Authorization token missing"}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            email = payload.get("sub")
            if email != ADMIN_EMAIL:
                return jsonify({"detail": "Not authorized"}), 403
            # Store user in request context if needed
            request.user_email = email
        except (jwt.PyJWTError, Exception):
            return jsonify({"detail": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or data.get("email") != ADMIN_EMAIL or data.get("password") != ADMIN_PASSWORD:
        return jsonify({"detail": "Invalid email or password"}), 401
    
    token = create_access_token(data.get("email"))
    return jsonify({"access_token": token, "token_type": "bearer"})

@app.route("/api/auth/me", methods=["GET"])
@admin_required
def get_me():
    return jsonify({"email": request.user_email})

# ── Helpers ─────────────────────────────────────────────

def parse_survey(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "questions": json.loads(row["questions"]),
        "translations": json.loads(row["translations"]) if row["translations"] else None,
        "createdAt": row["createdAt"]
    }

def parse_submission(row):
    return {
        "id": row["id"],
        "surveyId": row["surveyId"],
        "answers": json.loads(row["answers"]),
        "submittedAt": row["submittedAt"]
    }

# ── Public routes ───────────────────────────────────────

@app.route("/api/surveys", methods=["GET"])
def get_surveys():
    conn = get_db()
    rows = conn.execute("SELECT * FROM surveys").fetchall()
    conn.close()
    return jsonify([parse_survey(row) for row in rows])

@app.route("/api/surveys/<survey_id>", methods=["GET"])
def get_survey(survey_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM surveys WHERE id = ?", (survey_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"detail": "Survey not found"}), 404
    return jsonify(parse_survey(row))

@app.route("/api/submissions", methods=["POST"])
def create_submission():
    data = request.get_json()
    if not data or "surveyId" not in data or "answers" not in data:
        return jsonify({"detail": "Invalid submission data"}), 400
        
    sub_id = str(uuid.uuid4())
    submitted_at = datetime.now().isoformat()
    conn = get_db()
    conn.execute('''
        INSERT INTO submissions (id, surveyId, answers, submittedAt)
        VALUES (?, ?, ?, ?)
    ''', (
        sub_id,
        data["surveyId"],
        json.dumps(data["answers"]),
        submitted_at
    ))
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": sub_id,
        "surveyId": data["surveyId"],
        "answers": data["answers"],
        "submittedAt": submitted_at
    }), 201

# ── Protected routes ────────────────────────────────────

@app.route("/api/surveys", methods=["POST"])
@admin_required
def create_survey():
    data = request.get_json()
    if not data or "title" not in data or "questions" not in data:
        return jsonify({"detail": "Invalid survey data"}), 400
        
    survey_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    conn = get_db()
    conn.execute('''
        INSERT INTO surveys (id, title, description, questions, translations, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        survey_id,
        data["title"],
        data.get("description", ""),
        json.dumps(data["questions"]),
        json.dumps(data.get("translations")) if data.get("translations") else None,
        created_at
    ))
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": survey_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "questions": data["questions"],
        "translations": data.get("translations"),
        "createdAt": created_at
    }), 201

@app.route("/api/surveys/<survey_id>", methods=["PUT"])
@admin_required
def update_survey(survey_id):
    data = request.get_json()
    if not data:
        return jsonify({"detail": "No data provided"}), 400
        
    conn = get_db()
    row = conn.execute("SELECT * FROM surveys WHERE id = ?", (survey_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"detail": "Survey not found"}), 404
    
    conn.execute('''
        UPDATE surveys SET title = ?, description = ?, questions = ?, translations = ?
        WHERE id = ?
    ''', (
        data.get("title", row["title"]),
        data.get("description", row["description"]),
        json.dumps(data["questions"]) if "questions" in data else row["questions"],
        json.dumps(data.get("translations")) if data.get("translations") else row["translations"],
        survey_id
    ))
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": survey_id,
        "title": data.get("title", row["title"]),
        "description": data.get("description", row["description"]),
        "questions": data.get("questions", json.loads(row["questions"])),
        "translations": data.get("translations", json.loads(row["translations"]) if row["translations"] else None),
        "createdAt": row["createdAt"]
    })

@app.route("/api/surveys/<survey_id>", methods=["DELETE"])
@admin_required
def delete_survey(survey_id):
    conn = get_db()
    conn.execute("DELETE FROM surveys WHERE id = ?", (survey_id,))
    conn.execute("DELETE FROM submissions WHERE surveyId = ?", (survey_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Survey deleted"})

@app.route("/api/surveys/<survey_id>/submissions", methods=["GET"])
@admin_required
def get_submissions(survey_id):
    conn = get_db()
    rows = conn.execute("SELECT * FROM submissions WHERE surveyId = ?", (survey_id,)).fetchall()
    conn.close()
    return jsonify([parse_submission(row) for row in rows])

@app.route("/api/surveys/<survey_id>/submissions", methods=["DELETE"])
@admin_required
def delete_submissions(survey_id):
    conn = get_db()
    conn.execute("DELETE FROM submissions WHERE surveyId = ?", (survey_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Submissions deleted"})

if __name__ == "__main__":
    # Local dev server
    app.run(host="0.0.0.0", port=8000, debug=True)
