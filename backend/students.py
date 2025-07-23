from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import StudentDB
from auth import get_current_student

router = APIRouter()

# Pydantic models
class StudentProfile(BaseModel):
    total_assignments: int
    completed_assignments: int
    pending_assignments: int
    teachers_assignments: list

@router.get("/profile/")
async def get_student_profile(current_user: dict = Depends(get_current_student)):
    """Get student profile with statistics and teacher assignments"""
    try:
        profile = StudentDB.get_student_profile(current_user["id"])
        return profile
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student profile: {str(e)}")
