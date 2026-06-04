package com.knowledgepulse.dto;

import com.knowledgepulse.entity.Document;

import java.time.Instant;
import java.util.UUID;

public record AdminDocumentResponse(
    UUID id,
    String filename,
    String contentType,
    long fileSize,
    String status,
    int chunkCount,
    UUID ownerId,
    String ownerName,
    String ownerEmail,
    Instant createdAt
) {
    public static AdminDocumentResponse from(Document d) {
        return new AdminDocumentResponse(
            d.getId(),
            d.getFilename(),
            d.getContentType(),
            d.getFileSize(),
            d.getStatus().name(),
            d.getChunkCount(),
            d.getOwner().getId(),
            d.getOwner().getName(),
            d.getOwner().getEmail(),
            d.getCreatedAt()
        );
    }
}
