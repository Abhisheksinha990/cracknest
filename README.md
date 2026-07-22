# 🚀 CrackNest — AI-Powered Interview Preparation Platform

CrackNest is an end-to-end full-stack web application designed to help job seekers crack tech interviews. It combines AI-driven mock interviews, automated ATS resume analysis, company-specific preparation guides, and tier-based user management into a seamless, high-performance platform.

---

## ✨ Features

- 🎯 **AI Mock Interviews**: Conduct interactive, role-specific technical and behavioral mock interviews with instant AI feedback.
- 📄 **ATS Resume Analyzer**: Upload PDF/DOCX resumes to get real-time ATS compatibility scores, keyword matching, and actionable improvement recommendations.
- 🏢 **Company Interview Tracks**: Targeted interview questions and preparation blueprints tailored to top tech companies.
- 🔐 **Authentication & Security**: Robust JWT-based user authentication, role-based access control, and Google OAuth support.
- ⚡ **Admin Dashboard**: Manage user accounts, review plan upgrade requests, and monitor system analytics.
- 🎨 **Modern Futuristic UI**: Built with React, Tailwind CSS, Framer Motion, and interactive GLSL shader backgrounds.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom Animations & Glassmorphism
- **Routing**: React Router v6
- **UI Components**: Lucide React, Framer Motion, Canvas GLSL Shaders
- **Notifications**: React Hot Toast

### **Backend**
- **Framework**: Python 3.10+ / FastAPI
- **ORM & Database**: SQLAlchemy + SQLite (Dev) / PostgreSQL (Prod)
- **Authentication**: OAuth2 with Password Hashing (`passlib` + `bcrypt`) & PyJWT
- **Data Validation**: Pydantic v2
- **Web Server**: Uvicorn

---

## 📁 Repository Structure

```text
cracknest/
├── backend/
│   ├── routers/            # FastAPI route handlers (auth, admin, interviews)
│   ├── database.py         # SQLAlchemy engine & session setup (PostgreSQL & SQLite)
│   ├── main.py             # FastAPI entry point & CORS configuration
│   ├── models.py           # Database models (User, Interview, UpgradeRequest)
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── requirements.txt    # Python dependencies
│   └── render.yaml         # Render Deployment Blueprint
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client setup
│   │   ├── components/     # Reusable UI components & Layouts
│   │   ├── context/        # Auth Context provider
│   │   ├── pages/          # Landing, Auth, Dashboard, Resume Analyzer, etc.
│   │   └── utils/          # PDF/File parser utilities
│   ├── public/
│   │   └── _redirects      # Netlify SPA fallback routing configuration
│   ├── netlify.toml        # Netlify deployment configuration
│   └── package.json        # Frontend dependencies & scripts
├── DEPLOYMENT.md           # Step-by-step production deployment guide
├── render.yaml             # Render infrastructure blueprint
├── netlify.toml            # Netlify build & redirect rules
└── README.md               # Project documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 2. Clone the Repository
```bash
git clone https://github.com/Abhisheksinha990/cracknest.git
cd cracknest
```

### 3. Setup Backend (FastAPI)
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```
> The API server will start running locally at `http://127.0.0.1:5000` with interactive API docs at `http://127.0.0.1:5000/docs`.

### 4. Setup Frontend (React + Vite)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The web application will open at `http://localhost:5173`.

---

## 🌐 Production Deployment Guide

CrackNest is configured for automated single-click deployment using **Render** and **Netlify**:

- **Frontend**: Deployed on **Netlify** using [`netlify.toml`](file:///c:/Users/Abhishek%20sinha/Documents/cracknest/netlify.toml).
- **Backend & DB**: Deployed on **Render** using [`render.yaml`](file:///c:/Users/Abhishek%20sinha/Documents/cracknest/render.yaml) & Render PostgreSQL.

For detailed step-by-step instructions, see [`DEPLOYMENT.md`](file:///c:/Users/Abhishek%20sinha/Documents/cracknest/DEPLOYMENT.md).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
