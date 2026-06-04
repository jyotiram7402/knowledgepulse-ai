package com.knowledgepulse.controller;

import com.knowledgepulse.dto.UpdateProfileRequest;
import com.knowledgepulse.dto.UserResponse;
import com.knowledgepulse.security.SecurityUtils;
import com.knowledgepulse.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    @Operation(summary = "Current authenticated user")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.me(securityUtils.currentUser()));
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile (name / password)")
    public ResponseEntity<UserResponse> update(@Valid @RequestBody UpdateProfileRequest body) {
        return ResponseEntity.ok(userService.updateProfile(securityUtils.currentUser(), body));
    }
}
