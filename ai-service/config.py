"""Centralized configuration for the AI service."""
import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Config:
    env: str = os.getenv("ENV", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    log_level: str = os.getenv("LOG_LEVEL", "info")

    # Embedding
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    use_sbert: bool = os.getenv("USE_SBERT", "false").lower() == "true"

    # Recommendation
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.3"))
    top_n: int = int(os.getenv("TOP_N", "10"))
    recommendation_timeout: float = float(os.getenv("RECOMMENDATION_TIMEOUT", "5.0"))

    # Cache TTLs (seconds)
    embedding_cache_ttl: int = int(os.getenv("EMBEDDING_CACHE_TTL", "3600"))
    graph_cache_ttl: int = int(os.getenv("GRAPH_CACHE_TTL", "7200"))
    recommendation_cache_ttl: int = int(os.getenv("RECOMMENDATION_CACHE_TTL", "300"))

    # Weights for scoring
    weight_skill_match: float = float(os.getenv("W_SKILL", "40"))
    weight_mutual_interest: float = float(os.getenv("W_MUTUAL", "20"))
    weight_availability: float = float(os.getenv("W_AVAIL", "15"))
    weight_rating: float = float(os.getenv("W_RATING", "10"))
    weight_experience: float = float(os.getenv("W_EXP", "10"))
    weight_department: float = float(os.getenv("W_DEPT", "5"))


config = Config()
