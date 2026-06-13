from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.db.session import get_db
from app.db import models
from app.routers.auth import get_current_user
from app.services.agents import simulate_boardroom_debate

router = APIRouter(prefix="/startups", tags=["Board Room Debate"])

class DebatePrompt(BaseModel):
    topic: str

@router.post("/{startup_id}/boardroom/debate")
def run_debate(
    startup_id: str,
    payload: DebatePrompt,
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
        
    debate = simulate_boardroom_debate(startup_id, payload.topic)
    
    decision = models.Decision(
        startup_id=startup_id,
        debate_topic=payload.topic,
        debate_transcript=str(debate["transcript"]),
        consensus_recommendation=debate["consensus"]
    )
    db.add(decision)
    
    # Save simulated cost tracker linked to a task if possible
    agent = db.query(models.Agent).filter(models.Agent.startup_id == startup_id).first()
    if agent:
        task = db.query(models.Task).filter(models.Task.agent_id == agent.id).first()
        if task:
            cost_entry = models.TokenCost(
                task_id=task.id,
                model_name=settings.OLLAMA_MODEL,
                prompt_tokens=800,
                completion_tokens=1500,
                exact_cost_usd=debate["cost"]
            )
            db.add(cost_entry)
            
    db.commit()
    
    # Update Startup status to executing
    startup.status = "executing"
    db.commit()
    
    return {
        "status": "completed",
        "debate_transcript": debate["transcript"],
        "consensus_recommendation": debate["consensus"]
    }

@router.get("/{startup_id}/boardroom/debates")
def get_debates(
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

    decisions = db.query(models.Decision).filter(models.Decision.startup_id == startup_id).all()
    return [
        {
            "id": d.id,
            "topic": d.debate_topic,
            "transcript": eval(d.debate_transcript) if d.debate_transcript else [],
            "consensus": d.consensus_recommendation,
            "created_at": d.created_at
        } for d in decisions
    ]
