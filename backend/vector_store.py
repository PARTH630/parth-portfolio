
from pathlib import Path

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from text_splitter import split_documents


# =========================================
# PARTH.AI — VECTOR DATABASE CONFIGURATION
# =========================================

BASE_DIR = Path(__file__).resolve().parent

DB_PATH = BASE_DIR / "chroma_db"

COLLECTION_NAME = "parth_portfolio"

EMBEDDING_MODEL = (
    "sentence-transformers/all-MiniLM-L6-v2"
)


# =========================================
# STEP 1 — LOAD EMBEDDING MODEL
# =========================================


# =========================================
# STEP 1 — LOAD LOCAL EMBEDDING MODEL
# =========================================

def get_embedding_model():

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={
            "device": "cpu",
            "local_files_only": False
        },
        encode_kwargs={
            "normalize_embeddings": True
        }
    )

    return embeddings


# =========================================
# STEP 2 — CREATE VECTOR DATABASE
# =========================================

def create_vector_store():

    print("\nLoading portfolio documents...")

    chunks = split_documents()

    if not chunks:
        raise ValueError(
            "No document chunks found. Check backend/data."
        )

    print(f"Total chunks: {len(chunks)}")

    print("\nLoading Hugging Face embedding model...")

    embeddings = get_embedding_model()

    print("Embedding model loaded successfully!")

    # Create persistent Chroma vector store
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(DB_PATH)
    )

    # Stable IDs prevent duplicates on repeated runs
    chunk_ids = [
        f"parth-chunk-{index}"
        for index in range(len(chunks))
    ]

    print("\nGenerating and storing embeddings...")

    vector_store.add_documents(
        documents=chunks,
        ids=chunk_ids
    )

    print("\nVector database created successfully!")
    print(f"Stored chunks: {vector_store._collection.count()}")
    print(f"Database location: {DB_PATH}")

    return vector_store


# =========================================
# STEP 3 — LOAD EXISTING VECTOR DATABASE
# =========================================



def load_vector_store():
    """
    Load the existing ChromaDB vector store.

    If the database does not exist (for example,
    on a fresh Render deployment), create it
    automatically.

    Markdown documents will be indexed separately
    by sync_knowledge_base() during startup.
    """

    # Create database directory if missing
    DB_PATH.mkdir(parents=True, exist_ok=True)

    # Initialize CPU embedding model
    embeddings = get_embedding_model()

    # Load or create ChromaDB collection
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(DB_PATH),
    )

    return vector_store




# =========================================
# STEP 4 — TEST SEMANTIC SEARCH
# =========================================

def test_similarity_search(vector_store):

    question = (
        "What experience does Parth have "
        "with Python, AI and machine learning?"
    )

    print("\n" + "=" * 50)
    print("PARTH.AI — SEMANTIC SEARCH TEST")
    print("=" * 50)

    print(f"\nQUESTION: {question}")

    results = vector_store.similarity_search(
        query=question,
        k=3
    )

    print(f"\nRetrieved {len(results)} chunks")

    for index, doc in enumerate(results, start=1):

        print(f"\nRESULT {index}")
        print("-" * 40)

        print(
            "Source:",
            doc.metadata.get("source", "Unknown")
        )

        print(
            "Chunk ID:",
            doc.metadata.get("chunk_id", "N/A")
        )

        print("\nCONTENT:")
        print(doc.page_content)

        print("-" * 40)


# =========================================
# RUN SCRIPT
# =========================================

if __name__ == "__main__":

    vector_store = create_vector_store()

    test_similarity_search(vector_store)
