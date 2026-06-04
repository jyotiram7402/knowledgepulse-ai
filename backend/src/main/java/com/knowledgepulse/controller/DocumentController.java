package com.knowledgepulse.controller;

import com.knowledgepulse.dto.DocumentResponse;
import com.knowledgepulse.security.SecurityUtils;
import com.knowledgepulse.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Tag(name = "Documents")
public class DocumentController {

    private final DocumentService documentService;
    private final SecurityUtils securityUtils;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document (PDF, DOCX, TXT, MD)")
    public ResponseEntity<DocumentResponse> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.upload(securityUtils.currentUser(), file));
    }

    @GetMapping
    @Operation(summary = "List current user's documents")
    public ResponseEntity<Page<DocumentResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(documentService.listForUser(securityUtils.currentUser(),
            PageRequest.of(Math.max(page, 0), safeSize)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search documents by filename")
    public ResponseEntity<List<DocumentResponse>> search(@RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(documentService.search(securityUtils.currentUser(), q));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a document by id")
    public ResponseEntity<DocumentResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.get(securityUtils.currentUser(), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document and all its chunks")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        documentService.delete(securityUtils.currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}
