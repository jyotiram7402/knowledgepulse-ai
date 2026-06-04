package com.knowledgepulse.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
            "service", "knowledgepulse-backend",
            "status", "UP",
            "time", Instant.now().toString(),
            "docs", "/api/v1/swagger-ui.html"
        ));
    }
}
