package com.knowledgepulse.dto;

import com.knowledgepulse.entity.Document;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
    UUID id,
    String filename,
    String contentType,
    long fileSize,
    String url,
    String status,
    int chunkCount,
    String errorMessage,
    Instant createdAt
) {
    public static DocumentResponse from(Document d) {
        return new DocumentResponse(
            d.getId(),
            d.getFilename(),
            d.getContentType(),
            d.getFileSize(),
            d.getCloudinaryUrl(),
            d.getStatus().name(),
            d.getChunkCount(),
            d.getErrorMessage(),
            d.getCreatedAt()
        );
    }
}
