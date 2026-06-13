import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, Base

# Set DB to SQLite in-memory for testing
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def get_auth_token():
    # Register & Login to retrieve token
    email = "testrunner@forgeai.co"
    password = "runnerpassword"
    
    # Check if user already exists or register
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "Founder"}
    )
    
    # Authenticate via Form Data to get token
    login_resp = client.post(
        "/api/v1/auth/token",
        data={"username": email, "password": password}
    )
    return login_resp.json()["access_token"]

def test_auth_register_and_login():
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": "unique_tester@forgeai.co", "password": "password123", "role": "Founder"}
    )
    assert reg_response.status_code == 200
    data = reg_response.json()
    assert "access_token" in data

    # Test Login via standard OAuth2 Form Data
    login_response = client.post(
        "/api/v1/auth/token",
        data={"username": "unique_tester@forgeai.co", "password": "password123"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data

def test_create_startup_and_dashboard():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test creation
    create_resp = client.post(
        "/api/v1/startups",
        json={"name": "HealthAI Platform", "description": "AI scheduling system for clinics", "budget_limit": 5.0},
        headers=headers
    )
    assert create_resp.status_code == 200
    res = create_resp.json()
    assert res["status"] == "success"
    startup_id = res["startup_id"]
    
    # Test Dashboard query
    dash_resp = client.get(f"/api/v1/startups/{startup_id}/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["startup"]["name"] == "HealthAI Platform"
    assert dash_data["agents_count"] == 7
    assert len(dash_data["tasks"]) > 0

def test_trigger_debate():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    create_resp = client.post(
        "/api/v1/startups",
        json={"name": "SaaS Builder AI", "description": "SaaS code editor", "budget_limit": 10.0},
        headers=headers
    )
    startup_id = create_resp.json()["startup_id"]

    # Trigger boardroom debate
    debate_resp = client.post(
        f"/api/v1/startups/{startup_id}/boardroom/debate",
        json={"topic": "Should we build user auth or dashboard widgets first?"},
        headers=headers
    )
    assert debate_resp.status_code == 200
    debate_data = debate_resp.json()
    assert debate_data["status"] == "completed"
    assert "consensus_recommendation" in debate_data

def test_analytics_costs_and_metrics():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    costs_resp = client.get("/api/v1/analytics/costs", headers=headers)
    assert costs_resp.status_code == 200
    costs_data = costs_resp.json()
    assert "total_cost_usd" in costs_data
    
    # Test public metrics
    metrics_resp = client.get("/metrics")
    assert metrics_resp.status_code == 200
    assert "forgeai_active_startups_count" in metrics_resp.text
