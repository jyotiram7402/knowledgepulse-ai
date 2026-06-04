package com.knowledgepulse.dto;

import com.knowledgepulse.entity.ChatMessage;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatMessageResponse(
    UUID id,
    String role,
    String content,
    List<Citation> citations,
    Instant createdAt
) {
    public static ChatMessageResponse from(ChatMessage m, List<Citation> citations) {
        return new ChatMessageResponse(
            m.getId(),
            m.getRole().name(),
            m.getContent(),
            citations == null ? List.of() : citations,
            m.getCreatedAt()
        );
    }
}
