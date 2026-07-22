import requests

base_url = "http://127.0.0.1:5001/api/auth"

def test_upgrade():
    # 1. Register a user
    user_data = {
        "email": "upgrade1@test.com",
        "password": "password123",
        "name": "Upgrade User"
    }
    r_reg = requests.post(f"{base_url}/register", json=user_data)
    print("Register:", r_reg.status_code, r_reg.text)
    
    if r_reg.status_code == 200:
        token = r_reg.json().get("token")
        
        # 2. Upgrade
        headers = {"Authorization": f"Bearer {token}"}
        r_upg = requests.post(f"{base_url}/upgrade", headers=headers)
        print("Upgrade:", r_upg.status_code, r_upg.text)

if __name__ == "__main__":
    test_upgrade()
