package com.knowledgepulse.controller;

import com.knowledgepulse.dto.AdminDocumentResponse;
import com.knowledgepulse.dto.AdminStatsResponse;
import com.knowledgepulse.dto.UserResponse;
import com.knowledgepulse.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Aggregate system statistics")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.stats());
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (admin only)")
    public ResponseEntity<List<UserResponse>> users() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/documents")
    @Operation(summary = "List all documents across users (admin only)")
    public ResponseEntity<List<AdminDocumentResponse>> documents() {
        return ResponseEntity.ok(adminService.listDocuments());
    }
}
