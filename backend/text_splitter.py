
from langchain_text_splitters import RecursiveCharacterTextSplitter
from document_loader import load_documents


def split_documents():
    documents = load_documents()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = splitter.split_documents(documents)

    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = index

    return chunks


if __name__ == "__main__":
    chunks = split_documents()

    print("\nPARTH.AI — DOCUMENT CHUNKING")
    print("=" * 35)
    print(f"Total chunks created: {len(chunks)}")

    for index, chunk in enumerate(chunks, start=1):
        print(f"\nCHUNK {index}")
        print(f"Source: {chunk.metadata['source']}")
        print(f"Characters: {len(chunk.page_content)}")
        print(chunk.page_content)
        print("-" * 40)
