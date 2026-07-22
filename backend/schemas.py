from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "USER"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

    class Config:
        from_attributes = True

class InterviewResultCreate(BaseModel):
    company: str
    role: str
    rating: float
    feedback: str
    improvements: List[str]
    weakest_area: str

class InterviewResultResponse(BaseModel):
    id: str
    company: str
    role: str
    rating: float
    feedback: str
    improvements: str # JSON string
    weakest_area: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    id: str
    action: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
