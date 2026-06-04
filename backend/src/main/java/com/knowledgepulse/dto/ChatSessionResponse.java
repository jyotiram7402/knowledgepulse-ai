package com.knowledgepulse.dto;

import com.knowledgepulse.entity.ChatSession;

import java.time.Instant;
import java.util.UUID;

public record ChatSessionResponse(
    UUID id,
    String title,
    Instant createdAt,
    Instant updatedAt
) {
    public static ChatSessionResponse from(ChatSession s) {
        return new ChatSessionResponse(s.getId(), s.getTitle(), s.getCreatedAt(), s.getUpdatedAt());
    }
}
