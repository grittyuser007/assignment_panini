from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import uvicorn
import os
from pathlib import Path

# Import our modules
from database import init_db
from auth import router as auth_router
from assignments import router as assignments_router
from submissions import router as submissions_router
from students import router as students_router

# Initialize FastAPI app
app = FastAPI(
    title="EduTrack API",
    description="Assignment Management System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and uploads
app.mount("/static", StaticFiles(directory="../static"), name="static")
app.mount("/uploads", StaticFiles(directory="../uploads"), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(assignments_router, prefix="/assignments", tags=["Assignments"])
app.include_router(submissions_router, prefix="/submissions", tags=["Submissions"])
app.include_router(students_router, prefix="/students", tags=["Students"])

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    
    # Create uploads directory if it doesn't exist
    uploads_dir = Path("../uploads")
    uploads_dir.mkdir(exist_ok=True)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main page"""
    try:
        with open("../frontend/index.html", "r") as file:
            return HTMLResponse(content=file.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Welcome to EduTrack API</h1><p>Frontend files not found.</p>")

@app.get("/teacher.html", response_class=HTMLResponse)
async def teacher_page():
    """Serve teacher portal"""
    try:
        with open("../frontend/teacher.html", "r") as file:
            return HTMLResponse(content=file.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Teacher page not found")

@app.get("/student.html", response_class=HTMLResponse)
async def student_page():
    """Serve student portal"""
    try:
        with open("../frontend/student.html", "r") as file:
            return HTMLResponse(content=file.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Student page not found")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "EduTrack API is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
