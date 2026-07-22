from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import schemas, models
from database import get_db
from dependencies import get_current_user, JWT_SECRET, ALGORITHM
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_role = "ADMIN" if user.role == "ADMIN" else "USER"
    
    new_user = models.User(email=user.email, password=hashed_password, name=user.name, role=user_role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(data={"id": new_user.id, "role": new_user.role})
    
    return {"token": token, "user": schemas.UserResponse.model_validate(new_user)}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token(data={"id": db_user.id, "role": db_user.role})
    
    return {"token": token, "user": schemas.UserResponse.model_validate(db_user)}

import requests

@router.post("/google")
def google_login(payload: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    google_data = {}
    try:
        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}", timeout=5, verify=False)
        if response.status_code == 200:
            google_data = response.json()
    except Exception:
        pass

    if not google_data.get("email"):
        try:
            google_data = jwt.decode(payload.credential, options={"verify_signature": False})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Google token format")

    email = google_data.get("email")
    name = google_data.get("name") or google_data.get("given_name") or "Google User"

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    db_user = db.query(models.User).filter(models.User.email == email).first()
    
    if not db_user:
        hashed_password = pwd_context.hash("google_oauth_dummy_password_123!")
        db_user = models.User(email=email, password=hashed_password, name=name, role="USER")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token(data={"id": db_user.id, "role": db_user.role})
    return {"token": token, "user": schemas.UserResponse.model_validate(db_user)}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user



@router.post("/upgrade")
def upgrade_to_pro(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.role = "PRO"
    db.commit()
    db.refresh(current_user)
    
    token = create_access_token(data={"id": current_user.id, "role": current_user.role})
    return {"token": token, "user": schemas.UserResponse.model_validate(current_user)}

