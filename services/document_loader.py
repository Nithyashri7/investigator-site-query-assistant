import os
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

    return text.strip()


def load_sop_documents(text_dir: str):
    documents = []

    for category in os.listdir(text_dir):
        category_path = os.path.join(text_dir, category)
        if not os.path.isdir(category_path):
            continue

        for file in os.listdir(category_path):
            if not file.endswith(".txt"):
                continue

            file_path = os.path.join(category_path, file)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()

            if len(content) < 200:
                continue

            documents.append(
                f"SOP_NAME: {file.replace('.txt','')}\n"
                f"CATEGORY: {category}\n\n"
                f"{content}"
            )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,  # Increased from 800 to get more complete information
        chunk_overlap=200  # Increased overlap for better context
    )

    return splitter.create_documents(documents)
