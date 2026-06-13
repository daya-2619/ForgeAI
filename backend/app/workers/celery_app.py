import logging
from celery import Celery
from app.config import settings
from app.db.session import SessionLocal
from app.db import models
from app.services.agents import agent_runner, simulate_boardroom_debate

logger = logging.getLogger(__name__)

celery_app = Celery(
    "forgeai_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="tasks.run_venture_generation")
def run_venture_generation_task(startup_id: str, idea_prompt: str):
    logger.info(f"Initiating agent workforce pipeline for Startup: {startup_id}")
    db = SessionLocal()
    try:
        # Fetch Startup model from Database
        startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
        if not startup:
            logger.error(f"Startup not found: {startup_id}")
            return False
            
        startup.status = "validating"
        db.commit()
        
        # Instantiate agent execution loop
        initial_state = {
            "startup_id": startup_id,
            "idea": idea_prompt,
            "prd_content": {},
            "architecture_content": {},
            "debate_transcript": [],
            "confidence_score": 1.0,
            "accumulated_cost": 0.0,
            "current_step": "START"
        }
        
        # Execute LangGraph
        result = agent_runner.invoke(initial_state)
        
        # Setup mock agents in DB to mirror the architecture
        roles = ["PM", "Architect", "Developer", "QA", "DevOps", "Finance", "Marketing"]
        for role in roles:
            agent = models.Agent(
                startup_id=startup_id,
                role=role,
                system_prompt=f"You are the {role} specialist agent.",
                model_latency_ms=120.0
            )
            db.add(agent)
        db.commit()
        
        # Save generated tasks outputs
        # PM task
        pm_agent = db.query(models.Agent).filter(models.Agent.startup_id == startup_id, models.Agent.role == "PM").first()
        task_pm = models.Task(
            agent_id=pm_agent.id,
            name="Product Requirements Specification",
            description="Generate Problem statements, Pain-points, TAM/SAM/SOM",
            execution_status="completed",
            output_result=str(result.get("prd_content")),
            confidence_score=result.get("confidence_score", 1.0)
        )
        db.add(task_pm)
        
        # Architect task
        arch_agent = db.query(models.Agent).filter(models.Agent.startup_id == startup_id, models.Agent.role == "Architect").first()
        task_arch = models.Task(
            agent_id=arch_agent.id,
            name="System Architecture Design",
            description="Generate Database schemas and API specifications",
            execution_status="completed",
            output_result=str(result.get("architecture_content")),
            confidence_score=result.get("confidence_score", 1.0)
        )
        db.add(task_arch)
        
        # Log token usage cost entry
        db.commit() # Save tasks first to get task.id
        
        cost_entry = models.TokenCost(
            task_id=task_pm.id,
            model_name="claude-3-5-sonnet",
            prompt_tokens=1500,
            completion_tokens=2200,
            exact_cost_usd=result.get("accumulated_cost", 0.1)
        )
        db.add(cost_entry)
        
        # Update Startup Status
        startup.status = "debating"
        db.commit()
        
        logger.info(f"Venture blueprints generated for: {startup_id}. Transitioning to debate state.")
        return True
        
    except Exception as e:
        logger.error(f"Error in venture creation thread: {e}")
        startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
        if startup:
            startup.status = "failed"
            db.commit()
            
            # Log System Incident
            incident = models.Incident(
                startup_id=startup_id,
                type="generation_failed",
                severity="high",
                details=str(e),
                status="open"
            )
            db.add(incident)
            db.commit()
        return False
    finally:
        db.close()
