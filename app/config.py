import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")

SOP_DIR = os.path.join(DATA_DIR, "sop_files")
TEXT_DIR = os.path.join(DATA_DIR, "text_files")

os.makedirs(SOP_DIR, exist_ok=True)
os.makedirs(TEXT_DIR, exist_ok=True)

# ---------------- LLM Configuration (Local Ollama) ----------------

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# ✅ CHANGE MODEL (more stable than orca-mini)
LLM_MODEL = "mistral"   # fast, stable, very reliable for RAG

# ✅ INCREASE TIMEOUT (this fixes your fallback issue)
OLLAMA_TIMEOUT = 120    # seconds (2 minutes)

# ---------------- Numeric Configuration ----------------
# Chunking
MIN_CHUNK_SIZE = 300
MAX_CHUNK_SIZE = 2500
CHUNK_STEP = 1800

# Retrieval
RETRIEVAL_K = 5

# LLM Context
LLM_CONTEXT_CHUNKS = 3
LLM_CHUNK_TRUNCATION = 300
LLM_TEMPERATURE = 0.1
LLM_NUM_PREDICT = 80

# App Logic
DEFAULT_CONFIDENCE = 0.9
