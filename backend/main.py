
import json
import logging

from typing import Literal
from pathlib import Path
from functools import lru_cache
from time import perf_counter
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from knowledge_sync import (
    sync_knowledge_base,
    start_knowledge_watcher,
    knowledge_lock,
)

from rag_chain import (
    ask_parth_ai,
    generation_chain,
    format_documents,
    rewrite_followup,
    get_sources,
)

from retriever import get_retriever
from source_retrieval import retrieve_portfolio_documents


# ==========================================
# PARTH.AI — LOGGING
# ==========================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PROFILE_PATH = DATA_DIR / "profile.md"


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
# RAG WARM-UP
# ==========================================

def warmup_rag():

    logger.info(
        "[PARTH.AI] Starting RAG warm-up..."
    )

    start = perf_counter()

    retriever = cached_retriever()

    with knowledge_lock:
        documents = retriever.invoke(
            "What are Parth's technical skills?"
        )

    duration = perf_counter() - start

    logger.info(
        "[PARTH.AI] RAG warm-up finished in %.3fs",
        duration,
    )

    logger.info(
        "[PARTH.AI] Warm-up returned %d documents",
        len(documents),
    )


# ==========================================
# FASTAPI LIFESPAN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info(
        "[PARTH.AI] Backend starting..."
    )

    observer = None
    handler = None

    try:

        # ----------------------------------
        # STEP 1 — INITIALIZE CHROMADB
        # ----------------------------------

        logger.info(
            "[PARTH.AI] Step 1: Initializing vector database..."
        )

        retriever = await run_in_threadpool(
            cached_retriever
        )

        # ----------------------------------
        # STEP 2 — INDEX MARKDOWN DOCUMENTS
        # ----------------------------------

        logger.info(
            "[PARTH.AI] Step 2: Synchronizing knowledge base..."
        )

        await run_in_threadpool(
            sync_knowledge_base,
            retriever,
        )

        # ----------------------------------
        # STEP 3 — WARM UP RAG
        # ----------------------------------

        logger.info(
            "[PARTH.AI] Step 3: Warming up retrieval..."
        )

        await run_in_threadpool(
            warmup_rag
        )

        # ----------------------------------
        # STEP 4 — WATCH MARKDOWN CHANGES
        # ----------------------------------

        logger.info(
            "[PARTH.AI] Step 4: Starting knowledge watcher..."
        )

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
            await run_in_threadpool(
                observer.join
            )

        cached_retriever.cache_clear()


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="PARTH.AI Backend",
    description=(
        "Source-grounded RAG portfolio chatbot "
        "powered by FastAPI, LangChain, "
        "ChromaDB and Groq."
    ),
    version="1.3.0",
    lifespan=lifespan,
)


# ==========================================
# CORS — LOCALHOST + GITHUB PAGES
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://parth630.github.io",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ==========================================
# REQUEST / RESPONSE MODELS
# ==========================================

class ChatMessage(BaseModel):

    role: Literal["user", "assistant"]

    content: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )


class ChatRequest(BaseModel):

    question: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=10,
    )


class ChatResponse(BaseModel):

    answer: str


# ==========================================
# 1. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {
        "message": "PARTH.AI Backend Running",
        "status": "online",
        "version": "1.3.0",
    }


# ==========================================
# 2. HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    return {
        "status": "online",
        "service": "PARTH.AI",
    }


# ==========================================
# 3. KNOWLEDGE BASE STATUS
# ==========================================

@app.get("/knowledge/status")
def knowledge_status():

    if not PROFILE_PATH.is_file():

        raise HTTPException(
            status_code=404,
            detail="profile.md not found",
        )

    try:

        content = PROFILE_PATH.read_text(
            encoding="utf-8"
        )

    except OSError:

        logger.exception(
            "[PARTH.AI] Failed to read profile.md"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to read profile.md",
        )

    return {
        "status": "ready",
        "file": "profile.md",
        "characters": len(content),
        "sections": content.count("## "),
    }


# ==========================================
# 4. STANDARD CHAT ENDPOINT
# ==========================================

@app.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    start_time = perf_counter()

    try:

        retriever = cached_retriever()

        with knowledge_lock:

            answer = ask_parth_ai(
                question=question,
                retriever=retriever,
            )

        total_time = (
            perf_counter() - start_time
        )

        logger.info(
            "[PARTH.AI] Standard chat completed in %.3fs",
            total_time,
        )

        return ChatResponse(
            answer=answer
        )

    except Exception:

        logger.exception(
            "[PARTH.AI] Standard chat failed"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "PARTH.AI is temporarily unavailable. "
                "Please try again."
            ),
        )


# ==========================================
# SERVER-SENT EVENT HELPER
# ==========================================

def stream_event(event_type, data=None):

    payload = {
        "type": event_type,
        **(data or {}),
    }

    return (
        f"data: {json.dumps(payload)}\n\n"
    )


# ==========================================
# 5. STREAMING RAG CHAT
# ==========================================

@app.post("/chat/stream")
def chat_stream(request: ChatRequest):

    logger.info(
        "[PARTH.AI] Received %d history messages",
        len(request.history),
    )

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=422,
            detail="Question cannot be empty.",
        )

    def generate():

        start_total = perf_counter()

        try:

            # ------------------------------
            # STEP 1 — STATUS
            # ------------------------------

            yield stream_event(
                "status",
                {
                    "message": "Searching knowledge base..."
                },
            )

            retrieval_start = perf_counter()

            retriever = cached_retriever()

            # ------------------------------
            # STEP 2 — CONVERSATIONAL MEMORY
            # ------------------------------

            search_query = rewrite_followup(
                question,
                request.history,
            )

            logger.info(
                "[PARTH.AI] Search query: %s",
                search_query,
            )

            # ------------------------------
            # STEP 3 — SOURCE-AWARE RETRIEVAL
            # ------------------------------

            with knowledge_lock:

                documents = retrieve_portfolio_documents(
                    retriever,
                    search_query,
                )

            retrieval_time = (
                perf_counter() - retrieval_start
            )

            logger.info(
                "[PARTH.AI] Retrieval time: %.3fs",
                retrieval_time,
            )

            # ------------------------------
            # STEP 4 — HANDLE EMPTY RESULTS
            # ------------------------------

            if not documents:

                yield stream_event(
                    "token",
                    {
                        "text": (
                            "I don't have that information "
                            "in Parth's portfolio "
                            "knowledge base."
                        )
                    },
                )

                yield stream_event(
                    "done",
                    {
                        "total_time": round(
                            perf_counter() - start_total,
                            3,
                        )
                    },
                )

                return

            # ------------------------------
            # STEP 5 — PREPARE DOCUMENTS
            # ------------------------------

            context = format_documents(
                documents
            )

            sources = get_sources(
                documents
            )

            logger.info(
                "[PARTH.AI] Retrieved sources: %s",
                sources,
            )

            # Send structured sources to React.
            yield stream_event(
                "sources",
                {
                    "files": sources
                },
            )

            yield stream_event(
                "status",
                {
                    "message": "Generating response..."
                },
            )

            # ------------------------------
            # STEP 6 — STREAM GROQ RESPONSE
            # ------------------------------

            generation_start = perf_counter()

            first_token_time = None
            streamed_chunks = 0

            for chunk in generation_chain.stream({
                "context": context,
                "question": search_query,
            }):

                if not chunk:
                    continue

                if first_token_time is None:

                    first_token_time = (
                        perf_counter() - generation_start
                    )

                    logger.info(
                        "[PARTH.AI] Groq first token: %.3fs",
                        first_token_time,
                    )

                streamed_chunks += 1

                yield stream_event(
                    "token",
                    {
                        "text": chunk
                    },
                )

            # ------------------------------
            # STEP 7 — LOG PERFORMANCE
            # ------------------------------

            generation_time = (
                perf_counter() - generation_start
            )

            total_time = (
                perf_counter() - start_total
            )

            logger.info(
                "[PARTH.AI] Streamed chunks: %d",
                streamed_chunks,
            )

            logger.info(
                "[PARTH.AI] Groq generation: %.3fs",
                generation_time,
            )

            logger.info(
                "[PARTH.AI] Total request: %.3fs",
                total_time,
            )

            # ------------------------------
            # STEP 8 — COMPLETE STREAM
            # ------------------------------

            yield stream_event(
                "done",
                {
                    "retrieval_time": round(
                        retrieval_time, 3
                    ),
                    "first_token_time": (
                        round(first_token_time, 3)
                        if first_token_time is not None
                        else None
                    ),
                    "generation_time": round(
                        generation_time, 3
                    ),
                    "total_time": round(
                        total_time, 3
                    ),
                    "chunks": streamed_chunks,
                },
            )

        except Exception:

            logger.exception(
                "[PARTH.AI] Streaming request failed"
            )

            yield stream_event(
                "error",
                {
                    "message": (
                        "PARTH.AI is temporarily "
                        "unavailable. Please try again."
                    )
                },
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
