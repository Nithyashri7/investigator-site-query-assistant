from typing import Dict
import requests
import logging
from services.vector_store import get_vectorstore
from app.config import OLLAMA_BASE_URL, LLM_MODEL, OLLAMA_TIMEOUT

# Setup logging to show process
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def retrieve_chunks(query: str, k: int = 5) -> Dict:
    """
    Pure vector retrieval from SOPs.
    No LLM. No generation.
    """
    logger.info(f"🔍 Retrieving chunks for query: '{query}'")

    # 1️⃣ Get vector database
    vectordb = get_vectorstore()

    # 2️⃣ Create retriever
    retriever = vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k}
    )

    # 3️⃣ Retrieve documents (NEW LangChain API)
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
    Use local Ollama (orca-mini) to generate a grounded answer.
    Only synthesizes based on provided SOP chunks.
    Self-contained, no external APIs, no expiry.
    """
    
    logger.info(f"🤖 Starting LLM grounding with {len(chunks)} chunks using {LLM_MODEL}...")
    
    if not chunks:
        logger.warning("⚠️ No chunks provided to LLM")
        return "No relevant information found in the SOP documents."
    
    # Format chunks for LLM context - CRITICAL for grounding
    context_parts = []
    for i, chunk in enumerate(chunks[:3], 1):  # Use only TOP 3 for speed
        context_parts.append(f"[{chunk['sop_name']}]\n{chunk['chunk'][:300]}")  # Truncate to 300 chars
    
    context = "\n\n".join(context_parts)
    logger.info(f"📝 Context prepared: {len(context)} characters from top 3 docs")
    
    # OPTIMIZED: Ultra-simple prompt for fast orca-mini
    prompt = f"""Based ONLY on these SOPs, answer briefly:

{context}

Question: {query}

Answer (2 sentences max):"""
    
    try:
        logger.info(f"📤 Sending request to Ollama ({OLLAMA_BASE_URL})...")
        
        # Call local Ollama API
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1,  # Very low for grounding
                "num_predict": 80,  # Very short for speed
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
        else:
            error_msg = f"Ollama error {response.status_code}. Make sure: ollama serve"
            logger.error(error_msg)
            return error_msg
    
    except requests.exceptions.Timeout:
        logger.warning(f"⏱️ Ollama timeout. Returning retrieved documents as fallback answer.")
        # Return formatted chunks as answer when Ollama is not responding
        return _format_chunks_as_answer(chunks)
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"🔌 Cannot connect to Ollama. Returning retrieved documents as fallback answer.")
        # Return formatted chunks as answer when Ollama connection fails
        return _format_chunks_as_answer(chunks)
    except Exception as e:
        logger.warning(f"⚠️ LLM error: {str(e)}. Returning retrieved documents as fallback answer.")
        # Return formatted chunks as answer on any other error
        return _format_chunks_as_answer(chunks)


def _format_chunks_as_answer(chunks: list) -> str:
    """
    Format retrieved chunks as a readable answer when Ollama is unavailable.
    """
    if not chunks:
        return "No relevant information found in the SOP documents."
    
    # Use top 3 chunks
    formatted_chunks = []
    for idx, chunk in enumerate(chunks[:3], 1):
        sop_name = chunk.get('sop_name', 'Unknown SOP')
        text = chunk.get('chunk', '')
        formatted_chunks.append(f"[Document {idx}: {sop_name}]\n{text}\n")
    
    answer = "\n".join(formatted_chunks)
    logger.info(f"📄 Fallback: Returning formatted retrieved chunks ({len(answer)} chars)")
    
    return answer


