from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import aiofiles
import os
from datetime import datetime
from database import SubmissionDB
from auth import verify_token, get_current_teacher, get_current_student

router = APIRouter()

# Pydantic models
class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_path: str
    notes: Optional[str]
    submitted_at: str

async def save_submission_file(file: UploadFile, student_id: int, assignment_id: int) -> str:
    """Save uploaded submission file and return file path"""
    # Create timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"submission_s{student_id}_a{assignment_id}_{timestamp}_{file.filename}"
    file_path = os.path.join("../uploads", filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return filename

@router.post("/")
async def create_submission(
    assignment_id: int = Form(...),
    file: UploadFile = File(...),
    notes: str = Form(None),
    current_user: dict = Depends(get_current_student)
):
    """Submit assignment (students only)"""
    try:
        # Save uploaded file
        file_path = await save_submission_file(file, current_user["id"], assignment_id)
        
        # Create submission record
        submission_id = SubmissionDB.create_submission(
            assignment_id=assignment_id,
            student_id=current_user["id"],
            file_path=file_path,
            notes=notes
        )
        
        return {
            "message": "Assignment submitted successfully",
            "submission_id": submission_id
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit assignment: {str(e)}")

@router.get("/my/")
async def get_my_submissions(current_user: dict = Depends(get_current_student)):
    """Get all submissions by the current student"""
    try:
        submissions = SubmissionDB.get_submissions_by_student(current_user["id"])
        return submissions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get submissions: {str(e)}")

@router.get("/teacher/")
async def get_teacher_submissions(current_user: dict = Depends(get_current_teacher)):
    """Get all submissions for teacher's assignments"""
    try:
        submissions = SubmissionDB.get_submissions_by_teacher(current_user["id"])
        return submissions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get submissions: {str(e)}")

@router.get("/assignment/{assignment_id}")
async def get_assignment_submissions(
    assignment_id: int,
    current_user: dict = Depends(get_current_teacher)
):
    """Get all submissions for a specific assignment (teachers only)"""
    try:
        submissions = SubmissionDB.get_submissions_by_assignment(assignment_id)
        return submissions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignment submissions: {str(e)}")
