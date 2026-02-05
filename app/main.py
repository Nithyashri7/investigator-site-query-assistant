from fastapi import FastAPI, UploadFile, File, Query, Depends # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from typing import List
import os
import shutil
import json

from sqlalchemy.orm import Session # type: ignore

from app.schemas import QuestionRequest, ChatInteractionCreate
from app.database import get_db
from app.models import ChatInteraction
from app.config import RETRIEVAL_K, DEFAULT_CONFIDENCE

from services.rag_service import (
    retrieve_chunks,
    generate_grounded_answer_with_citations
)
from services.ingest_sops import ingest_single_file

BASE_DIR = "data"
SOP_DIR = os.path.join(BASE_DIR, "sop_files")
os.makedirs(SOP_DIR, exist_ok=True)

app = FastAPI(
    title="Clinical SOP Assistant",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {"status": "Running — no reprocessing on restart"}

# --------------------------------------------------
# SOP UPLOAD
# --------------------------------------------------

@app.post("/upload_sops")
async def upload_sops(
    category: str = Query(...),
    files: List[UploadFile] = File(...)
):
    category_dir = os.path.join(SOP_DIR, category)
    os.makedirs(category_dir, exist_ok=True)

    uploaded = []

    for file in files:
        path = os.path.join(category_dir, file.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        ingest_single_file(path)
        uploaded.append(file.filename)

    return {
        "message": "SOPs uploaded and indexed safely",
        "files": uploaded
    }

# --------------------------------------------------
# ASK QUESTION
# --------------------------------------------------

# --------------------------------------------------
# ASK QUESTION
# --------------------------------------------------

@app.post("/ask")
def ask_question(request: QuestionRequest):
    retrieval = retrieve_chunks(request.question, k=RETRIEVAL_K)
    matches = retrieval.get("matches", [])

    if not matches:
        return {
            "answer": "No relevant SOP information found.",
            "sources": [],
            "citations": [],
            "confidence_score": 0
        }

    rag_result = generate_grounded_answer_with_citations(
        request.question,
        matches
    )

    sources = list({m["sop_name"] for m in matches})

    return {
        "answer": rag_result["answer"],
        "sources": sources,
        "citations": rag_result["citations"],
        "confidence_score": DEFAULT_CONFIDENCE
    }

# --------------------------------------------------
# SAVE CHAT INTERACTION ✅ FIXED
# --------------------------------------------------

@app.post("/save-interaction")
def save_chat_interaction(
    data: ChatInteractionCreate,
    db: Session = Depends(get_db)
):
    record = ChatInteraction(
        question=data.question,
        answer=data.answer,
        sources=json.dumps(data.sources),      # ✅ FIX
        citations=json.dumps(data.citations),  # ✅ FIX
        liked=data.liked,
        feedback=data.feedback
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Chat interaction saved successfully",
        "id": record.id
    }

# --------------------------------------------------
# GET FEEDBACK (DASHBOARD)
# --------------------------------------------------

@app.get("/feedback")
def get_feedback(db: Session = Depends(get_db)):
    interactions = db.query(ChatInteraction).order_by(ChatInteraction.created_at.desc()).all()
    
    results = []
    for i in interactions:
        results.append({
            "id": i.id,
            "created_at": i.created_at,
            "question": i.question,
            "answer": i.answer,
            "liked": i.liked,
            "feedback": i.feedback
        })
    return results
