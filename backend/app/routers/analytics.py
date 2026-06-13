from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.routers.auth import get_current_user

router = APIRouter(tags=["Analytics & Observability"])

@router.get("/api/v1/analytics/costs")
def get_costs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Retrieve all startups for the active user
    startups = db.query(models.Startup).filter(models.Startup.user_id == current_user.id).all()
    startup_ids = [s.id for s in startups]
    
    total_cost = 0.0
    by_model = {}
    
    # Query token costs linked to tasks owned by user startups
    for s_id in startup_ids:
        agents = db.query(models.Agent).filter(models.Agent.startup_id == s_id).all()
        for a in agents:
            tasks = db.query(models.Task).filter(models.Task.agent_id == a.id).all()
            for t in tasks:
                costs = db.query(models.TokenCost).filter(models.TokenCost.task_id == t.id).all()
                for c in costs:
                    total_cost += c.exact_cost_usd
                    by_model[c.model_name] = by_model.get(c.model_name, 0.0) + c.exact_cost_usd
                    
    return {
        "total_cost_usd": round(total_cost, 4),
        "by_model": {m: round(val, 4) for m, val in by_model.items()}
    }

# Prometheus Compatible Observability Endpoint
@router.get("/metrics")
def prometheus_metrics(db: Session = Depends(get_db)):
    # Query counts for system telemetry
    startups_count = db.query(models.Startup).count()
    incidents_count = db.query(models.Incident).filter(models.Incident.status == "open").count()
    
    costs = db.query(models.TokenCost).all()
    total_cost_sum = sum([c.exact_cost_usd for c in costs])
    calls_count = len(costs)
    
    # Format Prometheus text/plain payload
    metrics = [
        "# HELP forgeai_active_startups_count Current active startup canvases.",
        "# TYPE forgeai_active_startups_count gauge",
        f"forgeai_active_startups_count {startups_count}",
        
        "# HELP forgeai_open_incidents_count Active outstanding operations incidents.",
        "# TYPE forgeai_open_incidents_count gauge",
        f"forgeai_open_incidents_count {incidents_count}",
        
        "# HELP forgeai_total_api_calls_count Total API calls run by agents workforce.",
        "# TYPE forgeai_total_api_calls_count counter",
        f"forgeai_total_api_calls_count {calls_count}",
        
        "# HELP forgeai_total_accumulated_cost_usd Sum total of LLM API cost in USD.",
        "# TYPE forgeai_total_accumulated_cost_usd counter",
        f"forgeai_total_accumulated_cost_usd {round(total_cost_sum, 6)}"
    ]
    
    payload = "\n".join(metrics) + "\n"
    return Response(content=payload, media_type="text/plain")
