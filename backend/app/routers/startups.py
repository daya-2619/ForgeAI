from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db import models
from app.routers.auth import get_current_user
from app.workers.celery_app import run_venture_generation_task

router = APIRouter(prefix="/startups", tags=["Startups"])

class StartupCreate(BaseModel):
    name: str
    description: str
    budget_limit: float = 10.0

class StartupResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    budget_limit: float

    class Config:
        from_attributes = True

@router.post("", response_model=dict)
def create_startup(
    startup_in: StartupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    startup = models.Startup(
        user_id=current_user.id,
        name=startup_in.name,
        description=startup_in.description,
        model_budget_limit=startup_in.budget_limit,
        status="validating"
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)
    
    # Run synchronously for local demo capability fallback, or asynchronously if Celery is fully active.
    # In production: run_venture_generation_task.delay(startup.id, startup.description)
    run_venture_generation_task(startup.id, startup.description)
    
    return {"status": "success", "startup_id": startup.id}

@router.get("", response_model=List[StartupResponse])
def list_startups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Startup).filter(models.Startup.user_id == current_user.id).all()

@router.get("/{startup_id}/dashboard")
def get_startup_dashboard(
    startup_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    startup = db.query(models.Startup).filter(
        models.Startup.id == startup_id,
        models.Startup.user_id == current_user.id
    ).first()
    
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found or unauthorized access"
        )
        
    agents = db.query(models.Agent).filter(models.Agent.startup_id == startup_id).all()
    
    tasks = []
    total_cost = 0.0
    for agent in agents:
        agent_tasks = db.query(models.Task).filter(models.Task.agent_id == agent.id).all()
        for t in agent_tasks:
            tasks.append({
                "id": t.id,
                "agent_role": agent.role,
                "name": t.name,
                "description": t.description,
                "status": t.execution_status,
                "confidence_score": t.confidence_score,
                "output": t.output_result
            })
            costs = db.query(models.TokenCost).filter(models.TokenCost.task_id == t.id).all()
            total_cost += sum([c.exact_cost_usd for c in costs])
            
    incidents = db.query(models.Incident).filter(models.Incident.startup_id == startup_id).all()
    
    return {
        "startup": {
            "id": startup.id,
            "name": startup.name,
            "description": startup.description,
            "status": startup.status,
            "budget_limit": startup.model_budget_limit
        },
        "agents_count": len(agents),
        "total_cost": round(total_cost, 4),
        "tasks": tasks,
        "incidents_count": len(incidents),
        "incidents": [
            {"id": i.id, "type": i.type, "severity": i.severity, "details": i.details, "status": i.status}
            for i in incidents
        ]
    }

@router.post("/{startup_id}/approve")
def approve_startup_sprint(
    startup_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    startup = db.query(models.Startup).filter(
        models.Startup.id == startup_id,
        models.Startup.user_id == current_user.id
    ).first()
    
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found or unauthorized access"
        )
        
    startup.status = "executing"
    db.commit()
    return {"status": "approved", "startup_status": startup.status}
