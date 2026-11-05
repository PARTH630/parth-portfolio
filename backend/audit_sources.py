
# ==========================================
# PARTH.AI — RAG SOURCE AUDIT
# ==========================================

from retriever import get_retriever

questions = [
    "Tell me about Parth's HCLTech experience.",
    "What did Parth do at Nullclass?",
    "Explain the Vendor Performance Analysis project.",
    "Tell me about the ServiceNow automation project.",
    "Where did Parth study?"
]

print("\nPARTH.AI — SOURCE ATTRIBUTION AUDIT")
print("=" * 55)

retriever = get_retriever()

for question in questions:

    print(f"\nQUESTION: {question}")
    print("-" * 55)

    documents = retriever.invoke(question)

    print(f"Retrieved documents: {len(documents)}")

    for index, doc in enumerate(documents, start=1):

        print(f"\nSOURCE {index}")

        print(
            "File:",
            doc.metadata.get("source", "MISSING")
        )

        print(
            "Chunk ID:",
            doc.metadata.get("chunk_id", "MISSING")
        )

        print(
            "All metadata:",
            doc.metadata
        )

        print(
            "Content preview:",
            doc.page_content[:350]
        )

        print("-" * 55)

print("\nSOURCE AUDIT COMPLETE")
