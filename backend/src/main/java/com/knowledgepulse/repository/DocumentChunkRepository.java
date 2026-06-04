package com.knowledgepulse.repository;

import com.knowledgepulse.entity.Document;
import com.knowledgepulse.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    List<DocumentChunk> findByDocumentOrderByChunkIndexAsc(Document document);

    long countByDocument(Document document);

    @Modifying
    @Query("DELETE FROM DocumentChunk c WHERE c.document.id = :documentId")
    void deleteByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Find top-K most similar chunks for the given owner using pgvector cosine distance.
     * The `:query` parameter must be a pgvector-compatible literal, e.g. "[0.1,0.2,...]".
     */
    @Query(value = """
        SELECT id, document_id, owner_id, chunk_index, content, token_count,
               (embedding <=> CAST(:query AS vector)) AS distance
          FROM document_chunks
         WHERE owner_id = CAST(:ownerId AS uuid)
           AND embedding IS NOT NULL
         ORDER BY embedding <=> CAST(:query AS vector)
         LIMIT :topK
    """, nativeQuery = true)
    List<Object[]> findSimilarForOwner(@Param("ownerId") String ownerId,
                                        @Param("query") String query,
                                        @Param("topK") int topK);
}
