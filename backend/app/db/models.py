import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

# Helper to support both SQLite (testing) and PostgreSQL UUID type
class GUID(String):
    pass

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Founder")  # Founder, Adviser, Auditor
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    startups = relationship("Startup", back_populates="owner")

class Startup(Base):
    __tablename__ = "startups"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="validating")  # validating, debating, approved, executing, failed
    model_budget_limit = Column(Float, default=10.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="startups")
    agents = relationship("Agent", back_populates="startup", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="startup", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="startup", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(String(36), ForeignKey("startups.id"), nullable=False)
    role = Column(String(50), nullable=False)  # PM, Architect, Developer, QA, DevOps, Finance, Marketing
    system_prompt = Column(Text, nullable=True)
    model_latency_ms = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    startup = relationship("Startup", back_populates="agents")
    tasks = relationship("Task", back_populates="agent", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    execution_status = Column(String(50), default="pending")  # pending, running, completed, failed
    output_result = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    
    agent = relationship("Agent", back_populates="tasks")
    token_costs = relationship("TokenCost", back_populates="task", cascade="all, delete-orphan")

class TokenCost(Base):
    __tablename__ = "token_costs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False)
    model_name = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    exact_cost_usd = Column(Float, default=0.0)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("Task", back_populates="token_costs")

class Decision(Base):
    __tablename__ = "decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(String(36), ForeignKey("startups.id"), nullable=False)
    debate_topic = Column(String(255), nullable=False)
    debate_transcript = Column(Text, nullable=True)
    consensus_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    startup = relationship("Startup", back_populates="decisions")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(String(36), ForeignKey("startups.id"), nullable=False)
    type = Column(String(100), nullable=False)  # hallucination_detected, budget_exceeded, build_failure
    severity = Column(String(50), default="low")  # low, medium, high, critical
    details = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open, resolved
    raised_at = Column(DateTime, default=datetime.utcnow)
    
    startup = relationship("Startup", back_populates="incidents")
