from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import shutil

from app.schemas import QuestionRequest
from services.rag_service import retrieve_chunks, generate_grounded_answer
from services.ingest_sops import ingest_single_pdf

BASE_DIR = "data"
SOP_DIR = os.path.join(BASE_DIR, "sop_files")
os.makedirs(SOP_DIR, exist_ok=True)

app = FastAPI(
    title="Investigator Site Query Assistant",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🚫 NO STARTUP INGESTION (FIXED)

@app.get("/")
def root():
    return {"status": "Running — no reprocessing on restart"}

# ✅ INGEST ONLY UPLOADED FILES
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

        ingest_single_pdf(path)
        uploaded.append(file.filename)

    return {
        "message": "SOPs uploaded and indexed safely",
        "files": uploaded
    }

@app.post("/ask")
def ask_question(request: QuestionRequest):
    retrieval = retrieve_chunks(request.question, k=5)
    matches = retrieval.get("matches", [])

    if not matches:
        return {
            "answer": "No relevant SOP information found.",
            "sources": [],
            "confidence_score": 0
        }

    answer = generate_grounded_answer(request.question, matches)
    sources = list({m["sop_name"] for m in matches})

    return {
        "answer": answer,
        "sources": sources,
        "confidence_score": 0.9
    }
