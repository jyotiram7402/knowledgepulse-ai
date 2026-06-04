package com.knowledgepulse.dto;

public record Citation(
    int marker,
    String chunkId,
    String documentId,
    int chunkIndex,
    double similarity,
    String snippet
) {}
