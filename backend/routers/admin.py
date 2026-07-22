from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from dependencies import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    users = db.query(models.User).all()
    user_data = []
    for user in users:
        interviews = db.query(models.InterviewResult).filter(models.InterviewResult.user_id == user.id).all()
        activities = db.query(models.Activity).filter(models.Activity.user_id == user.id).order_by(models.Activity.created_at.desc()).limit(5).all()
        
        avg_rating = sum(i.rating for i in interviews) / len(interviews) if interviews else 0
        
        user_data.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "created_at": user.created_at,
            "interviews_completed": len(interviews),
            "average_rating": round(avg_rating, 1),
            "recent_activities": [schemas.ActivityResponse.model_validate(a) for a in activities]
        })
    
    return user_data
