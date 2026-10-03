import chromadb

from app.config import settings

_collection: chromadb.Collection | None = None


def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=settings.chroma_path)
        _collection = client.get_or_create_collection(
            name="innovations",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def embed_and_store(doc_id: str, text: str, metadata: dict) -> None:
    from app.llm import embed

    vector = await embed(text)
    get_collection().upsert(
        ids=[doc_id],
        embeddings=[vector],
        documents=[text],
        metadatas=[metadata],
    )


async def similarity_search(query_text: str, n_results: int = 20) -> list[dict]:
    from app.llm import embed

    vector = await embed(query_text)
    col = get_collection()
    count = col.count()
    if count == 0:
        return []

    results = col.query(
        query_embeddings=[vector],
        n_results=min(n_results, count),
        include=["distances", "metadatas"],
    )

    out = []
    for i, doc_id in enumerate(results["ids"][0]):
        distance = results["distances"][0][i]
        score = 1.0 - distance  # cosine distance → similarity
        out.append({
            "id": doc_id,
            "score": score,
            "metadata": results["metadatas"][0][i],
        })
    return out
