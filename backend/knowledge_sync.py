
import hashlib
import logging
import threading

from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from text_splitter import split_documents


# ==========================================
# PARTH.AI — AUTOMATIC KNOWLEDGE SYNC
# ==========================================

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Prevent reading while ChromaDB is updating.
knowledge_lock = threading.RLock()


def knowledge_signature():
    """
    Calculate a fingerprint of all Markdown
    files, including file names and contents.
    """

    hasher = hashlib.sha256()

    files = sorted(DATA_DIR.rglob("*.md"))

    for path in files:
        relative_path = path.relative_to(DATA_DIR)

        hasher.update(
            relative_path.as_posix().encode("utf-8")
        )

        hasher.update(path.read_bytes())

    return hasher.hexdigest()


# ==========================================
# SYNCHRONIZE EXISTING CHROMADB COLLECTION
# ==========================================

def sync_knowledge_base(retriever):
    """
    Use the already-loaded vector store.

    - Insert new chunks
    - Update modified chunks
    - Delete obsolete chunks
    - Preserve existing ChromaDB collection
    """

    with knowledge_lock:

        logger.info(
            "[PARTH.AI] Checking knowledge base..."
        )

        start_signature = knowledge_signature()

        # Uses your existing document loader
        # and text splitting configuration.
        chunks = split_documents()

        if not chunks:
            raise ValueError(
                "Knowledge sync stopped: "
                "no document chunks found. "
                "Existing ChromaDB data was preserved."
            )

        store = retriever.vectorstore

        # Read the currently indexed records.
        existing = store.get(
            include=["documents", "metadatas"]
        )

        existing_ids = existing["ids"]

        current_records = {
            record_id: {
                "content": content,
                "metadata": metadata or {}
            }
            for record_id, content, metadata in zip(
                existing_ids,
                existing["documents"],
                existing["metadatas"]
            )
        }

        # Match your original vector_store.py ID format.
        new_ids = [
            f"parth-chunk-{index}"
            for index in range(len(chunks))
        ]

        # Only re-embed chunks whose content
        # or metadata has actually changed.
        changed_chunks = []
        changed_ids = []

        for chunk_id, chunk in zip(
            new_ids,
            chunks
        ):

            old = current_records.get(chunk_id)

            if (
                old is None
                or old["content"] != chunk.page_content
                or old["metadata"] != chunk.metadata
            ):
                changed_chunks.append(chunk)
                changed_ids.append(chunk_id)

        # Upsert new or changed records.
        if changed_chunks:

            store.add_documents(
                documents=changed_chunks,
                ids=changed_ids
            )

        # Remove old chunks that are no longer
        # in the current Markdown knowledge base.
        obsolete_ids = list(
            set(existing_ids) - set(new_ids)
        )

        if obsolete_ids:

            store.delete(
                ids=obsolete_ids
            )

        # Detect files changing midway through sync.
        if knowledge_signature() != start_signature:
            raise RuntimeError(
                "Markdown files changed during sync. "
                "Another synchronization is required."
            )

        logger.info(
            "[PARTH.AI] KNOWLEDGE UPDATED: "
            "%d total chunks, "
            "%d inserted/updated, "
            "%d removed",
            len(chunks),
            len(changed_chunks),
            len(obsolete_ids)
        )


# ==========================================
# FILE WATCHER — AUTOMATIC SYNC
# ==========================================

class KnowledgeWatcher(FileSystemEventHandler):

    def __init__(self, retriever):
        super().__init__()

        self.retriever = retriever
        self.timer = None

        self.timer_lock = threading.Lock()
        self.stopped = False

        self.last_signature = None

    def on_any_event(self, event):

        # Ignore directory events.
        if event.is_directory:
            return

        # Ignore read/access events.
        if event.event_type not in {
            "created",
            "modified",
            "deleted",
            "moved"
        }:
            return

        paths = [
            str(event.src_path),
            str(getattr(event, "dest_path", ""))
        ]

        # Only react to Markdown file changes.
        if not any(
            path.lower().endswith(".md")
            for path in paths
        ):
            return

        with self.timer_lock:

            if self.stopped:
                return

            # Debounce: wait for file saving
            # to finish before indexing.
            if self.timer is not None:
                self.timer.cancel()

            self.timer = threading.Timer(
                1.0,
                self.run_sync
            )

            self.timer.daemon = True
            self.timer.start()

    def run_sync(self):

        with self.timer_lock:
            if self.stopped:
                return

        try:

            signature = knowledge_signature()

            # Ignore duplicate file events.
            if signature == self.last_signature:
                return

            sync_knowledge_base(
                self.retriever
            )

            self.last_signature = signature

        except Exception:

            logger.exception(
                "[PARTH.AI] Knowledge sync failed"
            )

    def stop(self):

        with self.timer_lock:

            self.stopped = True

            if self.timer is not None:
                self.timer.cancel()


# ==========================================
# START WATCHING MARKDOWN FILES
# ==========================================

def start_knowledge_watcher(retriever):

    if not DATA_DIR.is_dir():
        raise FileNotFoundError(
            f"Knowledge directory missing: {DATA_DIR}"
        )

    handler = KnowledgeWatcher(retriever)

    handler.last_signature = knowledge_signature()

    observer = Observer()

    observer.schedule(
        handler,
        str(DATA_DIR),
        recursive=True
    )

    observer.start()

    logger.info(
        "[PARTH.AI] Watching Markdown files: %s",
        DATA_DIR
    )

    return observer, handler
