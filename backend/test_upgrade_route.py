from fastapi.testclient import TestClient
from main import app
from database import Base, engine, get_db
import models
from sqlalchemy.orm import sessionmaker

# Create a clean session for test
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = TestingSessionLocal()

client = TestClient(app)

def test_upgrade():
    # 1. Register a user
    user_data = {
        "email": "testupgrade@test.com",
        "password": "password123",
        "name": "Test User",
        "role": "USER"
    }
    response = client.post("/api/auth/register", json=user_data)
    print("Register Response:", response.json())
    token = response.json().get("token")
    
    # 2. Upgrade to Pro
    headers = {"Authorization": f"Bearer {token}"}
    upgrade_response = client.post("/api/auth/upgrade", headers=headers)
    print("Upgrade Status:", upgrade_response.status_code)
    print("Upgrade Response:", upgrade_response.json())

if __name__ == "__main__":
    test_upgrade()
