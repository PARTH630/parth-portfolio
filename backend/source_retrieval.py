
import logging
import re

from langchain_core.documents import Document

logger = logging.getLogger(__name__)


# ==========================================
# PARTH.AI — DOCUMENT-AWARE RETRIEVAL
# ==========================================

PROJECT_PREFIX = "projects/"

ACADEMIC_SOURCE = "projects/academic.md"

ACHIEVEMENT_SOURCES = [
    "achievements.md",
    "projects/achievement.md",
]


# ==========================================
# HELPER — LOAD INDEXED DOCUMENT CHUNKS
# ==========================================

def load_source_chunks(vectorstore, source):
    """
    Load every indexed chunk belonging to
    a particular Markdown source file.
    """

    result = vectorstore.get(
        where={"source": source},
        include=["documents", "metadatas"],
    )

    documents = []

    contents = result.get("documents") or []
    metadatas = result.get("metadatas") or []

    for content, metadata in zip(
        contents,
        metadatas,
    ):

        if not content or not content.strip():
            continue

        documents.append(
            Document(
                page_content=content,
                metadata=metadata or {},
            )
        )

    # Restore chunk order when metadata contains it.
    documents.sort(
        key=lambda doc: int(
            doc.metadata.get("chunk_id", 0)
        )
    )

    return documents


# ==========================================
# HELPER — LOAD ALL INDEXED PROJECTS
# ==========================================

def load_all_projects(vectorstore):
    """
    Retrieve every document chunk whose source
    is inside the projects/ directory.

    Uses ChromaDB's existing indexed documents.
    """

    result = vectorstore.get(
        include=["documents", "metadatas"]
    )

    documents = []

    contents = result.get("documents") or []
    metadatas = result.get("metadatas") or []

    for content, metadata in zip(
        contents,
        metadatas,
    ):

        if not content or not content.strip():
            continue

        metadata = metadata or {}

        source = str(
            metadata.get("source", "")
        ).replace("\\", "/")

        if not source.startswith(PROJECT_PREFIX):
            continue

        documents.append(
            Document(
                page_content=content,
                metadata=metadata,
            )
        )

    # Group chunks by source and restore their order.
    def chunk_sort_key(doc):

        source = str(
            doc.metadata.get("source", "")
        )

        try:
            chunk_id = int(
                doc.metadata.get("chunk_id", 0)
            )
        except (ValueError, TypeError):
            chunk_id = 0

        return source, chunk_id

    documents.sort(key=chunk_sort_key)

    logger.info(
        "[PARTH.AI] Retrieved %d project chunks "
        "from %d source files",
        len(documents),
        len({
            doc.metadata.get("source")
            for doc in documents
        }),
    )

    return documents


# ==========================================
# HELPER — DETECT GENERAL PROJECT QUESTIONS
# ==========================================

def is_general_project_query(query):
    """
    Detect requests asking for a list or overview
    of portfolio projects rather than one project.
    """

    patterns = [
        r"\ball (?:of )?(?:his |her |your |parth'?s )?projects\b",
        r"\blist (?:of )?(?:his |her |your |parth'?s )?projects\b",
        r"\bshow (?:me )?(?:all )?(?:his |her |your |parth'?s )?projects\b",
        r"\bwhat (?:are |were )?(?:his |her |your |parth'?s )?projects\b",
        r"\bwhich projects\b",
        r"\bportfolio projects\b",
        r"\bprojects (?:has |have )(?:he |you |parth)\b",
        r"\btell me about (?:his |her |your |parth'?s )?projects\b",
        r"\bproject list\b",
        r"\bproject overview\b",
    ]

    return any(
        re.search(pattern, query)
        for pattern in patterns
    )


# ==========================================
# HELPER — DETECT ACADEMIC QUESTIONS
# ==========================================

def is_academic_query(query):

    keywords = [
        "academic project",
        "academic research",
        "powder metallurgy",
        "boron oxide",
        "b2o3",
        "al-b2o3",
        "aluminium composite",
        "aluminum composite",
    ]

    return any(
        keyword in query
        for keyword in keywords
    )


# ==========================================
# HELPER — DETECT ACHIEVEMENT QUESTIONS
# ==========================================

def is_achievement_query(query):

    keywords = [
        "achievement",
        "achievements",
        "academic accomplishment",
        "accomplishments",
        "awards",
        "honors",
        "honours",
    ]

    return any(
        keyword in query
        for keyword in keywords
    )


# ==========================================
# MAIN — PORTFOLIO DOCUMENT RETRIEVAL
# ==========================================


def retrieve_portfolio_documents(
    retriever,
    question,
    search_query=None,
):
    """
    Use the original question for topic routing.
    Use the rewritten question for semantic retrieval.
    """

    query = question.lower().strip()

    semantic_query = search_query or question

    vectorstore = retriever.vectorstore

    if is_general_project_query(query):

        logger.info(
            "[PARTH.AI] ALL PROJECTS route triggered"
        )

        documents = load_all_projects(vectorstore)

        if documents:
            return documents

        logger.warning(
            "[PARTH.AI] No indexed projects found"
        )

    elif is_academic_query(query):

        documents = load_source_chunks(
            vectorstore,
            ACADEMIC_SOURCE
        )

        if documents:
            return documents

    elif is_achievement_query(query):

        for source in ACHIEVEMENT_SOURCES:

            documents = load_source_chunks(
                vectorstore,
                source
            )

            if documents:
                return documents

    logger.info(
        "[PARTH.AI] Using MMR fallback"
    )

    return retriever.invoke(semantic_query)

    """
    Route portfolio questions to appropriate
    indexed documents.

    1. General project questions -> all projects
    2. Academic questions -> academic source
    3. Achievement questions -> achievement source
    4. Other questions -> existing MMR retriever
    """

    query = question.lower().strip()

    vectorstore = retriever.vectorstore

    # --------------------------------------
    # 1. ALL PROJECTS
    # --------------------------------------

    if is_general_project_query(query):

        logger.info(
            "[PARTH.AI] General project query detected"
        )

        documents = load_all_projects(
            vectorstore
        )

        if documents:
            return documents

        logger.warning(
            "[PARTH.AI] No indexed project documents found. "
            "Falling back to MMR."
        )

    # --------------------------------------
    # 2. ACADEMIC PROJECTS
    # --------------------------------------

    elif is_academic_query(query):

        logger.info(
            "[PARTH.AI] Academic project query detected"
        )

        documents = load_source_chunks(
            vectorstore,
            ACADEMIC_SOURCE,
        )

        if documents:
            return documents

        logger.warning(
            "[PARTH.AI] Academic project source missing. "
            "Falling back to MMR."
        )

    # --------------------------------------
    # 3. ACHIEVEMENTS
    # --------------------------------------

    elif is_achievement_query(query):

        logger.info(
            "[PARTH.AI] Achievement query detected"
        )

        for source in ACHIEVEMENT_SOURCES:

            documents = load_source_chunks(
                vectorstore,
                source,
            )

            if documents:
                return documents

        logger.warning(
            "[PARTH.AI] Achievement source missing. "
            "Falling back to MMR."
        )

    # --------------------------------------
    # 4. DEFAULT SEMANTIC RETRIEVAL
    # --------------------------------------

    logger.info(
        "[PARTH.AI] Using general MMR retrieval"
    )

    return retriever.invoke(question)
