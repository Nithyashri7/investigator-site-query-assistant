from pydantic import BaseModel # type: ignore
from typing import List, Optional, Any


# ----------------------------
# EXISTING (DO NOT CHANGE)
# ----------------------------

class QuestionRequest(BaseModel):
    question: str


class AnswerResponse(BaseModel):
    question: str
    answer: str
    confidence_score: float
    sources: List[str]


# ----------------------------
# NEW (FOR DB STORAGE)
# ----------------------------

class ChatInteractionCreate(BaseModel):
    question: str
    answer: str
    sources: List[str]
    citations: Optional[List[Any]] = []
    liked: Optional[bool] = None
    feedback: Optional[str] = None
