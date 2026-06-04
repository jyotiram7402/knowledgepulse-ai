package com.knowledgepulse.controller;

import com.knowledgepulse.dto.ChatMessageResponse;
import com.knowledgepulse.dto.ChatSessionResponse;
import com.knowledgepulse.dto.CreateSessionRequest;
import com.knowledgepulse.dto.SendMessageRequest;
import com.knowledgepulse.security.SecurityUtils;
import com.knowledgepulse.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Tag(name = "Chat")
public class ChatController {

    private final ChatService chatService;
    private final SecurityUtils securityUtils;

    @GetMapping("/sessions")
    @Operation(summary = "List chat sessions for the current user")
    public ResponseEntity<List<ChatSessionResponse>> list() {
        return ResponseEntity.ok(chatService.listSessions(securityUtils.currentUser()));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Create a new chat session")
    public ResponseEntity<ChatSessionResponse> create(@Valid @RequestBody(required = false) CreateSessionRequest body) {
        String title = body == null ? null : body.title();
        return ResponseEntity.ok(chatService.createSession(securityUtils.currentUser(), title));
    }

    @GetMapping("/sessions/{id}/messages")
    @Operation(summary = "List messages in a chat session")
    public ResponseEntity<List<ChatMessageResponse>> messages(@PathVariable UUID id) {
        return ResponseEntity.ok(chatService.listMessages(securityUtils.currentUser(), id));
    }

    @PostMapping("/sessions/{id}/messages")
    @Operation(summary = "Send a message and get a RAG-grounded answer")
    public ResponseEntity<ChatMessageResponse> send(@PathVariable UUID id,
                                                    @Valid @RequestBody SendMessageRequest body) {
        return ResponseEntity.ok(chatService.sendMessage(securityUtils.currentUser(), id, body));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Delete a chat session and all messages")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        chatService.deleteSession(securityUtils.currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}
