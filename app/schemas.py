from pydantic import BaseModel
from typing import List


class QuestionRequest(BaseModel):
    question: str


class AnswerResponse(BaseModel):
    question: str
    answer: str
    confidence_score: float
    sources: List[str]
