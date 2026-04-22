from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document(text: str, chunk_size: int = 4000, chunk_overlap: int = 600) -> list[str]:
    """
    Split a long-context document into semantic segments using recursive character splitting.
    Uses 15% overlap by default to preserve sentence boundaries.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_text(text)
    return chunks
