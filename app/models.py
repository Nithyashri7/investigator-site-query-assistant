from sqlalchemy import Column, Integer, Text, Boolean, DateTime # type: ignore
from sqlalchemy.sql import func # type: ignore
from app.database import Base

class ChatInteraction(Base):
    __tablename__ = "chat_interactions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Text)
    citations = Column(Text)
    liked = Column(Boolean)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
