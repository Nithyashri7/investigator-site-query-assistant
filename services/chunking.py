import re

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
        if len(sec) < 300:
            continue

        # If section is too large (>2500 chars), split with overlap
        if len(sec) > 2500:
            for i in range(0, len(sec), 1800):
                chunk = sec[i:i+2500]
                if len(chunk) >= 300:  # Only add if meaningful
                    chunks.append(chunk)
        else:
            chunks.append(sec)

    return chunks if chunks else [text]  # Return full text if no chunks
