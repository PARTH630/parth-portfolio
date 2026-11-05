
import logging

from langchain_core.documents import Document

logger = logging.getLogger(__name__)


# ==========================================
# PARTH.AI — DOCUMENT-AWARE RETRIEVAL
# ==========================================

def retrieve_portfolio_documents(
    retriever,
    question
):
    """
    Use the relevant complete document
    when a question targets a specific topic.

    Otherwise use the existing MMR retriever.
    """

    query = question.lower().strip()

    source = None

    # Academic projects
    if (
        "academic project" in query
        or "academic research" in query
        or "powder metallurgy" in query
        or "boron oxide" in query
    ):
        source = "projects/academic.md"

    # Academic achievements
    elif (
        "achievement" in query
        or "academic accomplishment" in query
    ):
        source = "achievements.md"

    # Find all indexed chunks belonging
    # to the selected source document.
    if source:

        logger.info(
            "[PARTH.AI] Target source: %s",
            source
        )

        result = retriever.vectorstore.get(
            where={"source": source},
            include=["documents", "metadatas"]
        )

        documents = []

        for content, metadata in zip(
            result.get("documents") or [],
            result.get("metadatas") or []
        ):

            if content and content.strip():

                documents.append(
                    Document(
                        page_content=content,
                        metadata=metadata or {}
                    )
                )

        # Sort source chunks into document order.
        documents.sort(
            key=lambda doc: int(
                doc.metadata.get("chunk_id", 0)
            )
        )

        if documents:

            logger.info(
                "[PARTH.AI] Loaded %d chunks from %s",
                len(documents),
                source
            )

            return documents

        logger.warning(
            "[PARTH.AI] No indexed chunks found for %s. "
            "Using general retrieval.",
            source
        )

    # General questions use MMR as before.
    return retriever.invoke(question)
