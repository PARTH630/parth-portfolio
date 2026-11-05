
from vector_store import load_vector_store


# ==========================================
# PARTH.AI — LANGCHAIN RETRIEVER
# ==========================================

def get_retriever():
    """
    Load the existing Chroma vector database
    and create a LangChain retriever.
    """

    vector_store = load_vector_store()

    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 3,
            "fetch_k": 7,
            "lambda_mult": 0.7
        }
    )

    return retriever


# ==========================================
# RETRIEVE RELEVANT DOCUMENTS
# ==========================================

def retrieve_documents(question):
    retriever = get_retriever()

    documents = retriever.invoke(question)

    return documents


# ==========================================
# TEST THE RETRIEVER
# ==========================================

if __name__ == "__main__":

    questions = [
        "What technical skills does Parth have?",
        "Tell me about Parth's AI projects.",
        "Where did Parth study?",
        "What is Parth's work experience?"
    ]

    retriever = get_retriever()

    print("\nPARTH.AI — LANGCHAIN RETRIEVER")
    print("=" * 45)

    for question in questions:

        print(f"\nQUESTION: {question}")
        print("-" * 45)

        documents = retriever.invoke(question)

        print(f"Retrieved {len(documents)} documents")

        for index, doc in enumerate(
            documents,
            start=1
        ):
            print(f"\nRESULT {index}")
            print(
                "Source:",
                doc.metadata.get(
                    "source",
                    "Unknown"
                )
            )
            print(
                "Chunk ID:",
                doc.metadata.get(
                    "chunk_id",
                    "N/A"
                )
            )
            print("\nCONTENT:")
            print(doc.page_content)
            print("-" * 45)
