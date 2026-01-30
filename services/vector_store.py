import warnings
# Suppress LangChain deprecation warnings intentionally
warnings.filterwarnings("ignore", category=UserWarning, module="langchain")
warnings.filterwarnings("ignore", category=DeprecationWarning)

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

VECTOR_DB_DIR = "chroma_db"

# ✅ Sentence Transformer embedding (stable, fixed dimension)
embedding_function = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def get_vectorstore():
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)

    return Chroma(
        persist_directory=VECTOR_DB_DIR,
        embedding_function=embedding_function
    )
