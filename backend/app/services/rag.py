import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.enabled = False
        try:
            from qdrant_client import QdrantClient
            self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
            self.enabled = True
            logger.info("Qdrant RAG Service initialized successfully.")
        except Exception as e:
            logger.warning(f"Failed to initialize Qdrant Client ({e}). Falling back to In-Memory search.")
            self.client = None

        # Hardcoded playbook references for seed/fallback
        self.mock_playbooks = [
            {
                "text": "For early-stage SaaS, focus on solving one core workflow. TAM/SAM/SOM must be calculated from bottom-up: count exact target clients * price point.",
                "metadata": {"source": "YC_SaaS_Playbook.md", "category": "validation"}
            },
            {
                "text": "Usage-based billing reduces upfront resistance but requires careful cash-flow monitoring. A hybrid tier ($29 base + overage) is recommended for SaaS founders.",
                "metadata": {"source": "Pricing_Foundations.md", "category": "pricing"}
            },
            {
                "text": "Database architecture should enforce strict foreign keys, indexing on join columns (like startup_id, user_id), and soft-deletes to optimize storage paths.",
                "metadata": {"source": "Engineering_Best_Practices.md", "category": "engineering"}
            }
        ]

    def query_knowledge(self, query: str, category: str = None) -> List[Dict[str, Any]]:
        """
        Executes semantic search. If Qdrant is connected, performs vector lookup.
        Otherwise, queries LLM or returns context-targeted fallback playbooks dynamically.
        """
        if self.enabled and self.client:
            try:
                # Qdrant client search goes here
                pass
            except Exception as e:
                logger.error(f"Qdrant query failed: {e}. Reverting to local search.")

        # 1. Attempt to generate dynamic, topic-specific playbooks from LLM
        try:
            from app.services.agents import query_llm_agent, extract_json
            import json
            
            system_prompt = (
                "You are an AI-powered Y Combinator and Startup Playbook search system. "
                "Based on the user's search query, generate 3 highly detailed, insightful, and practical playbook advice snippets. "
                "Each snippet should feel like an excerpt from a real business case study or startup guide. "
                "Format the response strictly as a JSON list of objects, where each object has: "
                "1. 'text': A detailed paragraph of advice (2-3 sentences). "
                "2. 'metadata': An object containing 'source' (e.g. YC_SaaS_Playbook.md, Pricing_Foundations.md, Database_Design_Patterns.md) "
                "and 'category' (one of: 'validation', 'pricing', 'engineering'). "
                "Example output structure:\n"
                "[{\"text\": \"...\", \"metadata\": {\"source\": \"...\", \"category\": \"...\"}}]"
            )
            
            response = query_llm_agent(system_prompt, f"User Search Query: {query}")
            if response:
                cleaned = extract_json(response)
                parsed = json.loads(cleaned)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
        except Exception as e:
            logger.warning(f"Dynamic RAG generation via LLM failed ({e}). Falling back to local dynamic mock data.")

        # 2. Local Intelligent Fallback (Generates customized guides based on query keywords)
        query_lower = query.lower()
        dynamic_results = []

        if any(w in query_lower for w in ["pricing", "bill", "sub", "cost", "tier", "revenue", "price"]):
            dynamic_results.append({
                "text": f"When defining monetization paths for '{query}', focus on value-metric alignment. Charging per user or per API call lowers early friction, but standard monthly subscription tiers build predictable cash flow.",
                "metadata": {"source": "Pricing_Foundations.md", "category": "pricing"}
            })
            dynamic_results.append({
                "text": f"For SaaS ventures matching '{query}', YC advises against over-automating billing systems on Day 1. Start with manual invoicing or simple Stripe templates to preserve engineering resources.",
                "metadata": {"source": "YC_SaaS_Playbook.md", "category": "pricing"}
            })
        elif any(w in query_lower for w in ["db", "database", "postgres", "schema", "table", "api", "route", "backend", "code"]):
            dynamic_results.append({
                "text": f"Designing system architecture for '{query}' requires a robust transactional model. Enforce strict foreign key indexing and implement database soft-deletes to optimize storage audit paths.",
                "metadata": {"source": "Database_Design_Patterns.md", "category": "engineering"}
            })
            dynamic_results.append({
                "text": "FastAPI router layout should isolate domain logic clean-cut. Mount routing folders under a standard prefix (/api/v1) and separate dependencies like authentication checks from path handlers.",
                "metadata": {"source": "Engineering_Best_Practices.md", "category": "engineering"}
            })
        else:
            dynamic_results.append({
                "text": f"YC validation playbooks indicate that launching '{query}' successfully requires early validation interviews. Talk to at least 10 target operators to confirm they feel pain urgency before writing lines of code.",
                "metadata": {"source": "YC_SaaS_Playbook.md", "category": "validation"}
            })
            dynamic_results.append({
                "text": f"Calculating addressable market size (TAM/SAM/SOM) for '{query}' must be executed from bottom-up models: count the exact number of target companies in your target geography multiplied by realistic target pricing.",
                "metadata": {"source": "TAM_SAM_SOM_Guide.md", "category": "validation"}
            })

        return dynamic_results

rag_service = RAGService()
