from fastapi import APIRouter, Query
from typing import List, Dict, Any
from app.services.rag import rag_service

router = APIRouter(prefix="/rag", tags=["Knowledge Retrieval (RAG)"])

@router.get("/search", response_model=List[Dict[str, Any]])
def search_knowledge(
    query: str = Query(..., description="The query to search the knowledge base for"),
    category: str = Query(None, description="Optional filter by category")
):
    results = rag_service.query_knowledge(query, category=category)
    return results
