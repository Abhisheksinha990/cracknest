import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, admin, interviews

import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrackNest API")

# CORS middleware
# Reads ALLOWED_ORIGINS from env, or automatically permits all .netlify.app, .vercel.app, and localhost domains out of the box
raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
if raw_origins and raw_origins != "*":
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.netlify\.app|https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(interviews.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
