import sys
import os
import logging

# Ensure we can import from app
sys.path.append(os.getcwd())

print("Testing MCP Server Logic directly...")

try:
    from app.mcp_server import search_clinical_sops
    print("✅ Successfully imported search_clinical_sops")
except Exception as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)

# Test the function
print("Running search_clinical_sops('informed consent')...")
try:
    result = search_clinical_sops("What is the process for informed consent?")
    print(f"✅ Result received (first 100 chars): {result[:100]}...")
except Exception as e:
    print(f"❌ Execution error: {e}")
    sys.exit(1)

print("Logic verification complete.")
