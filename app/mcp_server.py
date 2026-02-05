import sys
import os

# Add project root to sys.path to allow importing 'services'
# This is required when running as 'python app/mcp_server.py'
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Redirect stdout to stderr during imports to prevent pollution
# which would break MCP JSON-RPC protocol
_original_stdout = sys.stdout
sys.stdout = sys.stderr

try:
    from mcp.server.fastmcp import FastMCP # type: ignore
    from services.rag_service import retrieve_chunks, generate_grounded_answer
finally:
    # Restore stdout for MCP communication
    sys.stdout = _original_stdout

# Initialize MCP Server
mcp = FastMCP("Clinical SOP Assistant")

@mcp.tool()
def search_clinical_sops(question: str) -> dict:
    """
    Search the Clinical SOP knowledge base and return a grounded answer.
    """
    retrieval = retrieve_chunks(question, k=5)
    matches = retrieval.get("matches", [])

    if not matches:
        return {
            "result": "No relevant information found in the SOP documents."
        }

    answer = generate_grounded_answer(question, matches)

    return {
        "result": answer
    }


if __name__ == "__main__":
    # This allows running the server directly via `python app/mcp_server.py`
    mcp.run()
