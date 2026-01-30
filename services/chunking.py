import re
from app.config import MIN_CHUNK_SIZE, MAX_CHUNK_SIZE, CHUNK_STEP

def semantic_chunk_sop(text: str) -> list[str]:
    """
    Split SOP text into semantic sections using headings.
    Creates larger chunks for better context and grounding.
    """

    # Split by major sections (numbered headings or ALL-CAPS headers)
    sections = re.split(
        r"\n(?=\d+\.|\d+\.\d+|[A-Z][A-Z\s]{4,}|PROCEDURE|PROCESS|STEP)",
        text
    )

    chunks = []

    for sec in sections:
        sec = sec.strip()
        # Minimum 300 chars to ensure meaningful content
        if len(sec) < MIN_CHUNK_SIZE:
            continue

        # If section is too large (>2500 chars), split with overlap
        if len(sec) > MAX_CHUNK_SIZE:
            for i in range(0, len(sec), CHUNK_STEP):
                chunk = sec[i:i+MAX_CHUNK_SIZE]
                if len(chunk) >= MIN_CHUNK_SIZE:  # Only add if meaningful
                    chunks.append(chunk)
        else:
            chunks.append(sec)

    return chunks if chunks else [text]  # Return full text if no chunks
