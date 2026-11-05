
import json
import logging
from typing import Literal
from knowledge_sync import (
    sync_knowledge_base,
    start_knowledge_watcher,
    knowledge_lock
)
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from pathlib import Path
from functools import lru_cache
from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from rag_chain import (
    ask_parth_ai,
    generation_chain,
    format_documents,
    rewrite_followup,
    get_sources
)

from retriever import get_retriever
from source_retrieval import retrieve_portfolio_documents


# ==========================================
# PARTH.AI — FASTAPI BACKEND
# ==========================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def cached_retriever():

    logger.info(
        "[PARTH.AI] Initializing ChromaDB retriever..."
    )

    return get_retriever()


# ==========================================
# PARTH.AI — MODEL WARM-UP
# ==========================================

def warmup_rag():

    logger.info(
        "[PARTH.AI] Starting RAG warm-up..."
    )

    start = perf_counter()

    # Step 1 — Load ChromaDB and embeddings
    retriever = cached_retriever()

    initialization_time = perf_counter() - start

    logger.info(
        "[PARTH.AI] Retriever initialized in %.3fs",
        initialization_time
    )

    # Step 2 — Execute one real retrieval
    # This also warms up the query embedding path.
    retrieval_start = perf_counter()

    documents = retriever.invoke(
        "What are Parth's technical skills?"
    )

    retrieval_time = (
        perf_counter() - retrieval_start
    )

    logger.info(
        "[PARTH.AI] Warm-up retrieval: %.3fs",
        retrieval_time
    )

    logger.info(
        "[PARTH.AI] Warm-up returned %d documents",
        len(documents)
    )

    total_time = perf_counter() - start

    logger.info(
        "[PARTH.AI] RAG READY in %.3fs",
        total_time
    )


# ==========================================
# FASTAPI APPLICATION LIFESPAN
# ==========================================


# ==========================================
# FASTAPI LIFESPAN + AUTOMATIC KNOWLEDGE SYNC
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info(
        "[PARTH.AI] Backend starting..."
    )

    observer = None
    handler = None

    try:

        # 1. Initialize the embedding model
        #    and warm up ChromaDB.
        await run_in_threadpool(warmup_rag)

        # 2. Synchronize Markdown documents
        #    changed while the server was offline.
        retriever = cached_retriever()

        await run_in_threadpool(
            sync_knowledge_base,
            retriever
        )

        # 3. Watch for future Markdown changes.
        observer, handler = start_knowledge_watcher(
            retriever
        )

        logger.info(
            "[PARTH.AI] Automatic knowledge sync active"
        )

        logger.info(
            "[PARTH.AI] Backend ready for requests"
        )

        yield

    finally:

        logger.info(
            "[PARTH.AI] Backend shutting down..."
        )

        if handler is not None:
            handler.stop()

        if observer is not None:
            observer.stop()
            await run_in_threadpool(observer.join)

        cached_retriever.cache_clear()


app = FastAPI(
    title="PARTH.AI Backend",
    description="LangChain RAG Portfolio Chatbot",
    version="1.2.0",
    lifespan=lifespan
)
BASE_DIR = Path(__file__).resolve().parent
PROFILE_PATH = BASE_DIR / "data" / "profile.md"


# ==========================================
# CORS — REACT FRONTEND
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)


# ==========================================
# REQUEST AND RESPONSE MODELS
# ==========================================

# ==========================================
# STEP 9 — CONVERSATIONAL MEMORY MODELS
# ==========================================

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]

    content: str = Field(
        ...,
        min_length=1,
        max_length=2000
    )


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=500
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=10
    )



class ChatResponse(BaseModel):
    answer: str


# ==========================================
# CACHED CHROMADB RETRIEVER
# ==========================================

@lru_cache(maxsize=1)
def cached_retriever():

    logger.info(
        "[PARTH.AI] Initializing ChromaDB retriever..."
    )

    return get_retriever()


# ==========================================
# 1. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {
        "message": "PARTH.AI Backend Running",
        "status": "online",
        "version": "1.1.0"
    }


# ==========================================
# 2. KNOWLEDGE BASE STATUS
# ==========================================

@app.get("/knowledge/status")
def knowledge_status():

    if not PROFILE_PATH.is_file():

        raise HTTPException(
            status_code=404,
            detail="profile.md not found"
        )

    try:

        content = PROFILE_PATH.read_text(
            encoding="utf-8"
        )

    except OSError:

        logger.exception(
            "Failed to read knowledge base profile"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to read profile.md"
        )

    return {
        "status": "ready",
        "file": "profile.md",
        "characters": len(content),
        "sections": content.count("## ")
    }


# ==========================================
# 3. STANDARD CHAT ENDPOINT
# ==========================================

@app.post(
    "/chat",
    response_model=ChatResponse
)
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty."
        )

    start_time = perf_counter()

    try:

        retriever = cached_retriever()

        with knowledge_lock:
            answer = ask_parth_ai(
                question=question,
                retriever=retriever
            )

        total_time = (
            perf_counter() - start_time
        )

        logger.info(
            "[PARTH.AI] Standard chat completed "
            "in %.3fs",
            total_time
        )

        return ChatResponse(
            answer=answer
        )

    except Exception:

        logger.exception(
            "PARTH.AI standard chat failed"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "PARTH.AI is temporarily unavailable. "
                "Please try again."
            )
        )


# ==========================================
# HELPER — SERVER-SENT EVENTS
# ==========================================

def stream_event(event_type, data=None):

    """
    Convert a response event into
    Server-Sent Events format.
    """

    payload = {
        "type": event_type,
        **(data or {})
    }

    return (
        f"data: {json.dumps(payload)}\n\n"
    )


# ==========================================
# 4. STREAMING RAG ENDPOINT
# ==========================================

@app.post("/chat/stream")
def chat_stream(request: ChatRequest):


    logger.info(
    "[PARTH.AI] Received %d history messages",
    len(request.history)
    )

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty."
        )

    def generate():

        start_total = perf_counter()

        try:

            # ==================================
            # STEP 1 — RETRIEVE DOCUMENTS
            # ==================================

            yield stream_event(
                "status",
                {
                    "message":
                    "Searching knowledge base..."
                }
            )

            start_retrieval = perf_counter()

            
            retriever = cached_retriever()

            # Rewrite the question using prior conversation.
            search_query = rewrite_followup(
                question,
                request.history
            )

            logger.info(
                "[PARTH.AI] Search query: %s",
                search_query
            )

            with knowledge_lock:
                documents = retrieve_portfolio_documents(
                    retriever,
                    search_query
                )


            retrieval_time = (
                perf_counter()
                - start_retrieval
            )

            logger.info(
                "[PARTH.AI] Retrieval time: %.3fs",
                retrieval_time
            )

            # ==================================
            # NO DOCUMENTS FOUND
            # ==================================

            if not documents:

                yield stream_event(
                    "token",
                    {
                        "text":
                        "I don't have that information "
                        "in Parth's portfolio "
                        "knowledge base."
                    }
                )

                yield stream_event(
                    "done",
                    {
                        "total_time":
                        round(
                            perf_counter()
                            - start_total,
                            3
                        )
                    }
                )

                return

            # ==================================
            # STEP 2 — FORMAT RAG CONTEXT
            # ==================================

            context = format_documents(
                documents
            )

            
# ==========================================
# STEP 11D — STRUCTURED SOURCE EVENT
# ==========================================

            sources = get_sources(documents)

            logger.info(              
                "[PARTH.AI] Retrieved sources: %s",
                sources
            )

            yield stream_event(
                "sources",
                {
                    "files": sources
                }
            )


            # ==================================
            # STEP 3 — STREAM GROQ ANSWER
            # ==================================

            start_generation = perf_counter()

            first_token_received = False

            first_token_time = None

            token_chunk_count = 0

            for chunk in generation_chain.stream({
                "context": context,
                "question": search_query
            }):

                if not chunk:
                    continue

                # --------------------------
                # FIRST-TOKEN LATENCY
                # --------------------------

                if not first_token_received:

                    first_token_time = (
                        perf_counter()
                        - start_generation
                    )

                    logger.info(
                        "[PARTH.AI] Groq first token: %.3fs",
                        first_token_time
                    )

                    first_token_received = True

                # --------------------------
                # STREAM CHUNK TO REACT
                # --------------------------

                token_chunk_count += 1

                yield stream_event(
                    "token",
                    {
                        "text": chunk
                    }
                )

            # ==================================
            # STEP 4 — PERFORMANCE METRICS
            # ==================================

            generation_time = (
                perf_counter()
                - start_generation
            )

            total_time = (
                perf_counter()
                - start_total
            )

            logger.info(
                "[PARTH.AI] Streamed chunks: %d",
                token_chunk_count
            )

            logger.info(
                "[PARTH.AI] Groq generation: %.3fs",
                generation_time
            )

            logger.info(
                "[PARTH.AI] Total request: %.3fs",
                total_time
            )

            # ==================================
            # STEP 5 — STREAM COMPLETE
            # ==================================

            yield stream_event(
                "done",
                {
                    "retrieval_time":
                    round(retrieval_time, 3),

                    "first_token_time":
                    (
                        round(first_token_time, 3)
                        if first_token_time is not None
                        else None
                    ),

                    "generation_time":
                    round(generation_time, 3),

                    "total_time":
                    round(total_time, 3),

                    "chunks":
                    token_chunk_count
                }
            )

        except Exception:

            logger.exception(
                "PARTH.AI streaming request failed"
            )

            yield stream_event(
                "error",
                {
                    "message":
                    "PARTH.AI is temporarily "
                    "unavailable. Please try again."
                }
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
