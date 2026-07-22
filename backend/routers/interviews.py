from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas, models
from database import get_db
from dependencies import get_current_user
import json

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.post("/save", response_model=schemas.InterviewResultResponse)
def save_interview(result: schemas.InterviewResultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_result = models.InterviewResult(
        user_id=current_user.id,
        company=result.company,
        role=result.role,
        rating=result.rating,
        feedback=result.feedback,
        improvements=json.dumps(result.improvements),
        weakest_area=result.weakest_area
    )
    db.add(db_result)
    
    db_activity = models.Activity(
        user_id=current_user.id,
        action="COMPLETED_INTERVIEW",
        details=json.dumps({"company": result.company, "role": result.role, "rating": result.rating})
    )
    db.add(db_activity)
    
    db.commit()
    db.refresh(db_result)
    
    return db_result

@router.get("/history")
def get_user_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    interviews = db.query(models.InterviewResult).filter(models.InterviewResult.user_id == current_user.id).order_by(models.InterviewResult.created_at.desc()).all()
    activities = db.query(models.Activity).filter(models.Activity.user_id == current_user.id).order_by(models.Activity.created_at.desc()).limit(20).all()
    
    return {
        "interviews": [schemas.InterviewResultResponse.model_validate(i) for i in interviews],
        "activities": [schemas.ActivityResponse.model_validate(a) for a in activities]
    }
