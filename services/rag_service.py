from typing import Dict
import requests
import logging
from services.vector_store import get_vectorstore
from app.config import (
    OLLAMA_BASE_URL, LLM_MODEL, OLLAMA_TIMEOUT,
    RETRIEVAL_K, LLM_CONTEXT_CHUNKS, LLM_CHUNK_TRUNCATION,
    LLM_TEMPERATURE, LLM_NUM_PREDICT
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def retrieve_chunks(query: str, k: int = RETRIEVAL_K) -> Dict:
    """
    Pure vector retrieval from SOPs.
    """
    logger.info(f"🔍 Retrieving chunks for query: '{query}'")

    vectordb = get_vectorstore()
    retriever = vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k}
    )

    docs = retriever.invoke(query)
    logger.info(f"✅ Retrieved {len(docs)} documents from vector DB")

    results = []
    for idx, doc in enumerate(docs, start=1):
        results.append({
            "rank": idx,
            "sop_name": doc.metadata.get("sop_name", "Unknown SOP"),
            "chunk": doc.page_content.strip()
        })

    return {
        "query": query,
        "matches": results
    }


def generate_grounded_answer(query: str, chunks: list) -> str:
    """
    Use local Ollama to generate a grounded answer.
    """
    logger.info(f"🤖 Starting LLM grounding with {len(chunks)} chunks using {LLM_MODEL}...")

    if not chunks:
        logger.warning("⚠️ No chunks provided to LLM")
        return "No relevant information found in the SOP documents."

    # Prepare context
    context_parts = []
    for i, chunk in enumerate(chunks[:LLM_CONTEXT_CHUNKS], 1):
        context_parts.append(f"[{chunk['sop_name']}]\n{chunk['chunk'][:LLM_CHUNK_TRUNCATION]}")

    context = "\n\n".join(context_parts)
    logger.info(f"📝 Context prepared: {len(context)} characters from top 3 docs")

    prompt = f"""Based ONLY on these SOPs, answer briefly:

{context}

Question: {query}

Answer (2 sentences max):"""

    try:
        logger.info(f"📤 Sending request to Ollama ({OLLAMA_BASE_URL})...")

        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": LLM_TEMPERATURE,
                "num_predict": LLM_NUM_PREDICT,
            },
            timeout=OLLAMA_TIMEOUT
        )

        logger.info(f"📥 Ollama response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            answer = result.get("response", "").strip()

            logger.info(f"✅ LLM generated answer ({len(answer)} chars)")

            if not answer:
                logger.warning("⚠️ Empty response from LLM")
                return "Unable to generate answer. Please try again."

            return answer

        error_msg = f"Ollama error {response.status_code}. Make sure: ollama serve"
        logger.error(error_msg)
        return error_msg

    except requests.exceptions.Timeout:
        logger.warning("⏱️ Ollama timeout. Returning retrieved documents as fallback answer.")
        return _format_chunks_as_answer(chunks)

    except requests.exceptions.ConnectionError:
        logger.warning("🔌 Cannot connect to Ollama. Returning retrieved documents as fallback answer.")
        return _format_chunks_as_answer(chunks)

    except Exception as e:
        logger.warning(f"⚠️ LLM error: {str(e)}. Returning retrieved documents as fallback answer.")
        return _format_chunks_as_answer(chunks)


def generate_grounded_answer_with_citations(query: str, chunks: list) -> Dict:
    """
    Returns answer + paragraph-level citations.
    """
    answer = generate_grounded_answer(query, chunks)

    citations = []
    for chunk in chunks[:LLM_CONTEXT_CHUNKS]:
        citations.append({
            "file_name": chunk.get("sop_name", "Unknown SOP"),
            "text": chunk.get("chunk")
        })

    logger.info(f"📚 Returning {len(citations)} citation paragraphs")

    return {
        "answer": answer,
        "citations": citations
    }


def _format_chunks_as_answer(chunks: list) -> str:
    """
    Fallback answer when Ollama is unavailable.
    """
    formatted = []
    for idx, chunk in enumerate(chunks[:LLM_CONTEXT_CHUNKS], 1):
        formatted.append(
            f"[Document {idx}: {chunk.get('sop_name')}]\n{chunk.get('chunk')}\n"
        )

    answer = "\n".join(formatted)
    logger.info(f"📄 Fallback answer built from retrieved chunks ({len(answer)} chars)")
    return answer
