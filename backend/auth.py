from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
from database import UserDB, verify_password

# JWT Configuration
SECRET_KEY = "d6c4b334f8e4ac891834aeb9edc45c10a6f228a714579051671b6f18d41059e0"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()
router = APIRouter()

# Pydantic models
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = UserDB.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_teacher(current_user: dict = Depends(verify_token)):
    """Get current user and verify they are a teacher"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user

def get_current_student(current_user: dict = Depends(verify_token)):
    """Get current user and verify they are a student"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return current_user

@router.post("/signup")
async def signup(user_data: UserSignup):
    """User signup endpoint"""
    try:
        # Validate role
        if user_data.role not in ["teacher", "student"]:
            raise HTTPException(status_code=400, detail="Role must be 'teacher' or 'student'")
        
        # Create user
        user_id = UserDB.create_user(
            name=user_data.name,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role
        )
        
        return {"message": "User created successfully", "user_id": user_id}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(user_data: UserLogin):
    """User login endpoint"""
    try:
        # Get user by email
        user = UserDB.get_user_by_email(user_data.email)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check role
        if user["role"] != user_data.role:
            raise HTTPException(status_code=401, detail="Invalid role for this user")
        
        # Create access token
        access_token = create_access_token(data={"user_id": user["id"]})
        
        # Remove password hash from user data
        user_safe = {k: v for k, v in user.items() if k != "password_hash"}
        
        return {
            "token": access_token,
            "token_type": "bearer",
            "user": user_safe
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(verify_token)):
    """Get current user information"""
    # Remove sensitive information
    user_safe = {k: v for k, v in current_user.items() if k != "password_hash"}
    return user_safe

@router.post("/logout")
async def logout(current_user: dict = Depends(verify_token)):
    """Logout endpoint (for future token blacklisting if needed)"""
    try:
        # In a production app, you might want to blacklist the token here
        # For now, we'll just return a success message
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return {"message": "Logged out successfully"}  # Always return success for logout
