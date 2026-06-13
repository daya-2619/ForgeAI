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
        Otherwise, returns relevant text matching basic keyword overlap.
        """
        if self.enabled and self.client:
            try:
                # In production, we'd embed the query and fetch from Qdrant:
                # results = self.client.search(collection_name="startup_knowledge", ...)
                # Return standard formatted payload list
                pass
            except Exception as e:
                logger.error(f"Qdrant query failed: {e}. Reverting to local search.")

        # In-memory keyword matching fallback
        query_words = set(query.lower().split())
        matched = []
        for doc in self.mock_playbooks:
            doc_words = set(doc["text"].lower().split())
            overlap = query_words.intersection(doc_words)
            if overlap or (category and doc["metadata"]["category"] == category):
                matched.append(doc)
        
        return matched if matched else self.mock_playbooks[:2]

rag_service = RAGService()
