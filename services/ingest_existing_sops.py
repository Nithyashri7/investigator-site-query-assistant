import os
from services.ingest_sops import ingest_single_file

BASE_DIR = "data/sop_files"

def ingest_all_existing_files():
    for root, _, files in os.walk(BASE_DIR):
        for file in files:
            if file.lower().endswith(".pdf"):
                file_path = os.path.join(root, file)
                ingest_single_file(file_path)

if __name__ == "__main__":
    ingest_all_existing_files()
    print("✅ All existing SOP PDFs have been ingested")
