from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import aiofiles
import os
from datetime import datetime
from database import AssignmentDB, SubmissionDB
from auth import verify_token, get_current_teacher, get_current_student

router = APIRouter()

# Pydantic models
class AssignmentCreate(BaseModel):
    title: str
    description: str
    due_date: str

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    due_date: str
    teacher_id: int
    file_path: Optional[str]
    created_at: str

async def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file and return file path"""
    if not file:
        return None
    
    # Create timestamp for unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"assignment_{timestamp}_{file.filename}"
    file_path = os.path.join("../uploads", filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return filename

@router.post("/")
async def create_assignment(
    title: str = Form(...),
    description: str = Form(...),
    due_date: str = Form(...),
    file: UploadFile = File(None),
    current_user: dict = Depends(get_current_teacher)
):
    """Create a new assignment (teachers only)"""
    try:
        # Save file if provided
        file_path = await save_upload_file(file) if file else None
        
        # Create assignment
        assignment_id = AssignmentDB.create_assignment(
            title=title,
            description=description,
            due_date=due_date,
            teacher_id=current_user["id"],
            file_path=file_path
        )
        
        return {
            "message": "Assignment created successfully",
            "assignment_id": assignment_id
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")

@router.get("/")
async def get_assignments(current_user: dict = Depends(verify_token)):
    """Get assignments based on user role"""
    try:
        if current_user["role"] == "teacher":
            assignments = AssignmentDB.get_assignments_by_teacher(current_user["id"])
        else:  # student
            assignments = AssignmentDB.get_assignments_for_student(current_user["id"])
        
        return assignments
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignments: {str(e)}")

@router.get("/teacher/")
async def get_teacher_assignments(current_user: dict = Depends(get_current_teacher)):
    """Get assignments created by the current teacher"""
    try:
        assignments = AssignmentDB.get_assignments_by_teacher(current_user["id"])
        return assignments
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get teacher assignments: {str(e)}")

@router.get("/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: int,
    current_user: dict = Depends(get_current_teacher)
):
    """Get all submissions for a specific assignment (teachers only)"""
    try:
        submissions = SubmissionDB.get_submissions_by_assignment(assignment_id)
        return submissions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get submissions: {str(e)}")

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_teacher)
):
    """Delete an assignment (teachers only, own assignments only)"""
    try:
        deleted = AssignmentDB.delete_assignment(assignment_id, current_user["id"])
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Assignment not found or not owned by you")
        
        return {"message": "Assignment deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete assignment: {str(e)}")
