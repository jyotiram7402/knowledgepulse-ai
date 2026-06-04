package com.knowledgepulse.dto;

import com.knowledgepulse.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    List<String> roles,
    boolean enabled,
    Instant createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
            u.getId(),
            u.getName(),
            u.getEmail(),
            u.getRoles().stream().map(r -> r.getName().name()).sorted().toList(),
            u.isEnabled(),
            u.getCreatedAt()
        );
    }
}
