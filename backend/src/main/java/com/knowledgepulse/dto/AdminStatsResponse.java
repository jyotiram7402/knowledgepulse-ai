package com.knowledgepulse.dto;

public record AdminStatsResponse(
    long totalUsers,
    long activeUsers,
    long totalDocuments,
    long totalChunks,
    long totalSessions,
    long totalMessages
) {}
