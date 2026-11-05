
from pathlib import Path
from langchain_core.documents import Document

# Backend folder
BASE_DIR = Path(__file__).resolve().parent

# Knowledge base folder
DATA_DIR = BASE_DIR / "data"


def load_documents():
    """
    Load Markdown files from the data folder
    and convert them into LangChain Documents.
    """

    documents = []

    # Find all Markdown files, including subfolders
    markdown_files = sorted(DATA_DIR.rglob("*.md"))

    for file_path in markdown_files:

        # Read Markdown content
        content = file_path.read_text(
            encoding="utf-8"
        ).strip()

        # Skip empty documents
        if not content:
            continue

        # Create a LangChain Document
        document = Document(
            page_content=content,
            metadata={
                "source": str(
                    file_path.relative_to(DATA_DIR)
                ).replace("\\", "/"),
                "filename": file_path.name,
                "file_type": "markdown"
            }
        )

        documents.append(document)

    return documents


# Test the document loader
if __name__ == "__main__":

    docs = load_documents()

    print("\nPARTH.AI KNOWLEDGE BASE")
    print("========================")
    print(f"Documents loaded: {len(docs)}")

    for index, doc in enumerate(docs, start=1):

        print(f"\nDocument {index}")
        print(f"Source: {doc.metadata['source']}")
        print(f"Characters: {len(doc.page_content)}")

        print("\nContent preview:")
        print(doc.page_content[:250])
        print("------------------------")
