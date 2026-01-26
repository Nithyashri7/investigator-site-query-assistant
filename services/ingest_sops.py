import os
from services.chunking import semantic_chunk_sop
from services.vector_store import get_vectorstore
from docling.document_converter import DocumentConverter

def ingest_single_pdf(pdf_path: str):
    """
    Ingest ONE PDF safely (no duplicates).
    """
    vectordb = get_vectorstore()
    converter = DocumentConverter()
    file_name = os.path.basename(pdf_path)

    try:
        doc = converter.convert(pdf_path)
        text = doc.document.export_to_markdown()
    except Exception as e:
        print(f"[WARN] Docling failed for {file_name}: {e}")
        return

    if not text or len(text) < 300:
        return

    chunks = semantic_chunk_sop(text)

    vectordb.add_texts(
        texts=chunks,
        metadatas=[
            {"sop_name": file_name, "chunk_id": i}
            for i in range(len(chunks))
        ],
        ids=[f"{file_name}_{i}" for i in range(len(chunks))]  # 🔥 CRITICAL
    )

    vectordb.persist()
    print(f"[OK] Ingested {file_name}")
