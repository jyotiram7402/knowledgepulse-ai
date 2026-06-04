package com.knowledgepulse.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 80) String name,
    @Size(min = 8, max = 100) String currentPassword,
    @Size(min = 8, max = 100) String newPassword
) {}
