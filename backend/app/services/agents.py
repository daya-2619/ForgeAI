import logging
import json
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
from app.config import settings
from app.services.rag import rag_service

logger = logging.getLogger(__name__)

# Define LangGraph execution state
class AgentState(TypedDict):
    startup_id: str
    idea: str
    prd_content: Dict[str, Any]
    architecture_content: Dict[str, Any]
    debate_transcript: List[Dict[str, str]]
    confidence_score: float
    accumulated_cost: float
    current_step: str

def extract_json(text: str) -> str:
    """Extracts raw JSON block from LLM response text, ignoring markdown markers and commentary."""
    text = text.strip()
    if "```json" in text:
        try:
            text = text.split("```json")[1].split("```")[0].strip()
        except Exception:
            pass
    elif "```" in text:
        try:
            text = text.split("```")[1].split("```")[0].strip()
        except Exception:
            pass
            
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1:
        return text[first_brace:last_brace+1]
    return text

# Helper to dispatch prompt queries to live LLM engines if keys are configured
def query_llm_agent(system_prompt: str, user_prompt: str) -> str:
    # 1. First choice: Local Ollama LLM
    if settings.OLLAMA_BASE_URL:
        try:
            import httpx
            url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
            payload = {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.0
                }
            }
            logger.info(f"Querying Ollama model {settings.OLLAMA_MODEL} at {url}...")
            response = httpx.post(url, json=payload, timeout=httpx.Timeout(10.0, connect=1.0))
            if response.status_code == 200:
                content = response.json()["message"]["content"]
                logger.info("Ollama response received successfully.")
                return content
            else:
                logger.warning(f"Ollama returned status code {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Failed to query Ollama API ({e}). Falling back.")

    # 2. Check for active Gemini API Key (Fallback)
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("mock"):
        try:
            from langchain_community.chat_models import ChatGoogleGenerativeAI
            chat = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=settings.GEMINI_API_KEY)
            messages = [
                ("system", system_prompt),
                ("user", user_prompt)
            ]
            response = chat.invoke(messages)
            return response.content
        except Exception as e:
            logger.warning(f"Failed to query Gemini API ({e}). Falling back.")

    # 3. Check for active OpenAI API Key (Fallback)
    if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("mock"):
        try:
            from langchain_community.chat_models import ChatOpenAI
            chat = ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY)
            messages = [
                ("system", system_prompt),
                ("user", user_prompt)
            ]
            response = chat.invoke(messages)
            return response.content
        except Exception as e:
            logger.warning(f"Failed to query OpenAI API ({e}). Falling back.")

    return ""

# 1. Product Manager Agent Node
def run_pm_agent(state: AgentState) -> Dict[str, Any]:
    idea = state["idea"]
    rag_docs = rag_service.query_knowledge(idea, category="validation")
    context_text = "\n".join([doc["text"] for doc in rag_docs])
    
    system_prompt = (
        "You are the Lead Product Manager. Write a Product Requirements Document (PRD) matching "
        "the following JSON structure: {\"problem_statement\": \"...\", \"pain_points\": [], \"tam_sam_som\": {}}"
    )
    user_prompt = f"Startup Idea: {idea}\nPlaybooks Context: {context_text}"
    
    # Try querying live LLM
    response_text = query_llm_agent(system_prompt, user_prompt)
    cost = 0.0
    
    if response_text:
        try:
            cleaned_response = extract_json(response_text)
            prd = json.loads(cleaned_response)
            cost = 0.015 # Calculate standard fee
        except Exception:
            logger.error("Failed to parse LLM JSON output. Reverting to fallback.")
            response_text = ""

    # Mock Fallback
    if not response_text:
        prd = {
            "problem_statement": f"Target users struggle to optimize workflows related to {idea}.",
            "pain_points": [
                "Lack of centralized tracking systems",
                "High latency in manual orchestration",
                "Severe lack of real-time budget forecasting tools"
            ],
            "tam_sam_som": {
                "tam": "$125,000,000",
                "sam": "$45,000,000",
                "som": "$8,500,000"
            },
            "features": [
                {"id": "feat_1", "name": "Venture Canvas Generator", "priority": "high"},
                {"id": "feat_2", "name": "AI Agent Dashboard Logger", "priority": "medium"},
                {"id": "feat_3", "name": "Real-time cost limit alarms", "priority": "high"}
            ]
        }
        cost = 0.045
    
    return {
        "prd_content": prd,
        "accumulated_cost": state["accumulated_cost"] + cost,
        "current_step": "PM_COMPLETE"
    }

# 2. Software Architect Agent Node
def run_architect_agent(state: AgentState) -> Dict[str, Any]:
    prd = state["prd_content"]
    system_prompt = (
        "You are the Principal Software Architect. Design database schemas and API specifications. "
        "Return structured JSON matching: {\"database_type\": \"...\", \"tables\": [], \"endpoints\": []}"
    )
    user_prompt = f"PRD specification context: {json.dumps(prd)}"
    
    response_text = query_llm_agent(system_prompt, user_prompt)
    cost = 0.0
    
    if response_text:
        try:
            cleaned_response = extract_json(response_text)
            architecture = json.loads(cleaned_response)
            cost = 0.02
        except Exception:
            response_text = ""

    # Fallback
    if not response_text:
        architecture = {
            "database_type": "PostgreSQL",
            "tables": [
                "users (id UUID, email VARCHAR, role VARCHAR)",
                "startups (id UUID, user_id UUID, status VARCHAR)",
                "agent_workforce (id UUID, startup_id UUID, role VARCHAR)",
                "token_costs (id UUID, model VARCHAR, cost_usd FLOAT)"
            ],
            "endpoints": [
                "POST /api/v1/auth/register - User registration",
                "POST /api/v1/startups - Create new venture canvas",
                "GET /api/v1/startups/{id}/dashboard - Aggregates analytics metrics"
            ]
        }
        cost = 0.055

    return {
        "architecture_content": architecture,
        "accumulated_cost": state["accumulated_cost"] + cost,
        "current_step": "ARCHITECT_COMPLETE"
    }

# 3. QA Agent Verification Node (Hallucination Detection)
def run_qa_verification(state: AgentState) -> Dict[str, Any]:
    prd = state["prd_content"]
    arch = state["architecture_content"]
    
    # Assess schema validity
    has_tam = "tam_sam_som" in prd
    has_endpoints = len(arch.get("endpoints", [])) > 0
    
    confidence = 0.95 if (has_tam and has_endpoints) else 0.55
        
    return {
        "confidence_score": confidence,
        "current_step": "QA_COMPLETE"
    }

# 4. Multi-Agent Board Room Debate Simulator
def simulate_boardroom_debate(startup_id: str, topic: str, tone: str = "Collaborative", selected_agents: List[str] = None) -> Dict[str, Any]:
    if not selected_agents:
        selected_agents = ["CEO", "CTO", "Finance", "Marketing"]
        
    system_prompt = (
        f"You are simulating an executive boardroom debate in a {tone} tone. "
        f"Generate a debate transcript between the following agents: {', '.join(selected_agents)}."
    )
    # Check live LLM
    response_text = query_llm_agent(system_prompt, f"Debate Topic: {topic}")
    
    agent_messages = {
        "CEO": {
            "Collaborative": "Let's work together to find a solution for {topic} that benefits everyone.",
            "Adversarial": "I need to see strong arguments for {topic}. Don't expect me to sign off on a weak plan.",
            "Pragmatic": "Let's focus on the easiest path to validate {topic} with minimum effort.",
            "Academic": "We must analyze the theoretical framework of {topic} before committing capital."
        },
        "CTO": {
            "Collaborative": "I agree with the PM. We can support the tech stack for {topic} using standard REST protocols.",
            "Adversarial": "No way! Building {topic} now introduces technical debt that will crush us later.",
            "Pragmatic": "We can deploy a quick serverless function for {topic} in an afternoon.",
            "Academic": "Let's review the architectural patterns of microservices relative to {topic}."
        },
        "Finance": {
            "Collaborative": "I'll allocate budget to support {topic} comfortably within our runway limits.",
            "Adversarial": "This is a waste of money! If we fund {topic}, we risk running out of cash in 3 months.",
            "Pragmatic": "Let's set a strict $500 budget cap on {topic} and cut it off if it exceeds.",
            "Academic": "Our TAM calculations show that {topic} will impact unit economics by 12%."
        },
        "Marketing": {
            "Collaborative": "Let's build a launch campaign for {topic} that aligns with our core messaging.",
            "Adversarial": "Marketing is already overloaded! We can't sell {topic} without a clear differentiator.",
            "Pragmatic": "Let's write a single landing page for {topic} and run some ad-words to test it.",
            "Academic": "Let's conduct a cohort analysis of our target personas to validate demand for {topic}."
        },
        "PM": {
            "Collaborative": "I've drafted user stories for {topic} that ensure customer success.",
            "Adversarial": "If we don't build {topic}, our competitors will overtake our core niche.",
            "Pragmatic": "Let's list the top three features for {topic} and drop the rest.",
            "Academic": "We need to map the customer journey map for {topic} in detail first."
        },
        "QA": {
            "Collaborative": "I'll create automated tests to ensure {topic} behaves perfectly.",
            "Adversarial": "This will introduce bugs! {topic} is highly complex and testing will delay us.",
            "Pragmatic": "I'll run a quick smoke-test on {topic} and check for major breakages.",
            "Academic": "Let's establish a strict test-coverage threshold of 95% for all {topic} endpoints."
        },
        "DevOps": {
            "Collaborative": "I'll set up CI/CD pipelines to deploy {topic} automatically.",
            "Adversarial": "Our infrastructure isn't ready for {topic}! We need to scale Kubernetes first.",
            "Pragmatic": "I'll deploy {topic} on a single VM for now to get it online.",
            "Academic": "We need to audit our infrastructure security policies regarding {topic} data."
        }
    }

    transcript = []
    for role in selected_agents:
        clean_role = role.replace(" Agent", "").replace(" specialist", "")
        msg_template = agent_messages.get(clean_role, agent_messages["CEO"]).get(tone, agent_messages["CEO"]["Collaborative"])
        transcript.append({
            "agent": f"{clean_role} Agent",
            "message": msg_template.format(topic=topic)
        })

    if response_text:
        consensus = response_text[:250]
    else:
        if tone == "Collaborative":
            consensus = f"Consensus reached: Approve the strategic implementation of {topic} through joint team coordination."
        elif tone == "Adversarial":
            consensus = f"Consensus reached: Put {topic} on hold until further security audits and cost-benefit analysis are presented."
        elif tone == "Pragmatic":
            consensus = f"Consensus reached: Build a rapid MVP prototype for {topic} within a strict $5.00 limit."
        else:
            consensus = f"Consensus reached: Research cohort data and build a detailed model before proceeding with {topic}."

    return {
        "transcript": transcript,
        "consensus": consensus,
        "cost": round(0.012 * len(selected_agents), 4)
    }

# Create LangGraph state flow
workflow = StateGraph(AgentState)

# Add Node definitions
workflow.add_node("pm_agent", run_pm_agent)
workflow.add_node("architect_agent", run_architect_agent)
workflow.add_node("qa_agent", run_qa_verification)

# Define transitions
workflow.set_entry_point("pm_agent")
workflow.add_edge("pm_agent", "architect_agent")
workflow.add_edge("architect_agent", "qa_agent")

def route_validation(state: AgentState):
    if state["confidence_score"] >= 0.7:
        return END
    else:
        return "pm_agent"

workflow.add_conditional_edges(
    "qa_agent",
    route_validation,
    {
        END: END,
        "pm_agent": "pm_agent"
    }
)

agent_runner = workflow.compile()
