package com.knowledgepulse.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_chunks", indexes = {
    @Index(name = "idx_chunks_document", columnList = "document_id"),
    @Index(name = "idx_chunks_owner", columnList = "owner_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentChunk {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "token_count")
    private Integer tokenCount;

    // Stored in a pgvector column. JPA persists it as the textual form
    // produced by toString() on a float[]; we map it through a converter.
    @Column(name = "embedding", columnDefinition = "vector(768)")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String embedding;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
