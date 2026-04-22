# Career Counselling AI — Full Stack Application

An AI-powered career counselling platform featuring a modern React frontend and a robust FastAPI backend. Get personalised career advice, resume analysis, and interview preparation through an intuitive chat interface.

---

## 🌟 Features

- 🤖 **Multi-Model AI Chat** — Support for Cloud (OpenRouter) and Local (LM Studio) AI models with real-time streaming responses.
- 👤 **Comprehensive User Profiles** — Personalised advice based on your skills, education, experience, and career goals.
- 📄 **Smart Resume Parsing** — Upload PDF or DOCX resumes to automatically extract skills and populate your profile.
- 💬 **Session Management** — Organise conversations into sessions with persistent history and automatic title generation.
- 🎨 **Modern Glassmorphic UI** — High-end aesthetic with dark/light mode support, markdown rendering, and interactive suggestions.
- 📊 **Career Resources** — Dedicated endpoints for resume review, interview prep, and career path recommendations.

---

## 🏗️ Project Structure

```text
.
├── main.py                 # FastAPI application entry point
├── career.py               # Career resources router (resume/interview/paths)
├── requirements.txt        # Backend dependencies
├── app/                    # Backend core logic
│   ├── database.py         # aiosqlite connection and schema initialisation
│   ├── models/             # Database models (User, Profile, Session, Message)
│   ├── routes/             # API route handlers (chat, sessions, profile)
│   ├── schemas/            # Pydantic data validation schemas
│   └── services/           # AI and Resume parsing services
└── career-frontend/        # React + Vite frontend
    ├── src/
    │   ├── api/            # API client for backend communication
    │   ├── components/     # UI Components (Chat, Sidebar, Profile, Auth)
    │   └── App.jsx         # Frontend application root
    └── package.json        # Frontend dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- (Optional) LM Studio for local AI or OpenRouter API key for cloud AI.

### 2. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (ANTHROPIC_API_KEY or OPENROUTER_API_KEY)

# Start the server
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd career-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## 📡 API Reference (Prefix: `/api/v1`)

### 🔐 Authentication & Profile
- `POST /profile/users` — Register a new user
- `POST /profile/login` — Authenticate user
- `PUT /profile/users/{user_id}/profile` — Update career profile
- `POST /profile/users/{user_id}/resume` — Upload & parse resume

### 💬 Chat & Sessions
- `POST /chat/?stream=true` — Send message and get (streaming) AI response
- `GET /sessions/user/{user_id}` — List all sessions for a user
- `POST /sessions/` — Create a new session
- `GET /sessions/{session_id}` — Get session details and message history

### 🎯 Career Tools
- `POST /career/resume-review` — Detailed AI analysis of resume text
- `POST /career/interview-prep` — Generate interview questions/tips for a role
- `GET /career/career-paths/{session_id}` — Personalised career recommendations
- `GET /career/tips/{topic}` — Quick actionable career tips

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, React Markdown, CSS Variables (Custom Design System).
- **Backend:** FastAPI, Python, aiosqlite (Asynchronous SQLite).
- **AI/ML:** Integration with Cloud LLMs via OpenRouter/Anthropic and Local LLMs via LM Studio/HuggingFace.
- **Parsing:** PyMuPDF & python-docx for document processing.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

