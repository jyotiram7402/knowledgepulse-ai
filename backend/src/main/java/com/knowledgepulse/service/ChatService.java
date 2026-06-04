package com.knowledgepulse.service;

import com.knowledgepulse.dto.ChatAnswer;
import com.knowledgepulse.dto.ChatMessageResponse;
import com.knowledgepulse.dto.ChatSessionResponse;
import com.knowledgepulse.dto.SendMessageRequest;
import com.knowledgepulse.entity.ChatMessage;
import com.knowledgepulse.entity.ChatSession;
import com.knowledgepulse.entity.User;
import com.knowledgepulse.exception.NotFoundException;
import com.knowledgepulse.repository.ChatMessageRepository;
import com.knowledgepulse.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final RagService ragService;

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(User owner) {
        return sessionRepository.findByOwnerOrderByUpdatedAtDesc(owner)
            .stream().map(ChatSessionResponse::from).toList();
    }

    @Transactional
    public ChatSessionResponse createSession(User owner, String title) {
        String safeTitle = (title == null || title.isBlank()) ? "New Chat" : title.trim();
        if (safeTitle.length() > 200) safeTitle = safeTitle.substring(0, 200);
        ChatSession session = ChatSession.builder().owner(owner).title(safeTitle).build();
        return ChatSessionResponse.from(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listMessages(User owner, UUID sessionId) {
        ChatSession session = sessionRepository.findByIdAndOwner(sessionId, owner)
            .orElseThrow(() -> new NotFoundException("Chat session not found"));
        return messageRepository.findBySessionOrderByCreatedAtAsc(session)
            .stream().map(m -> ChatMessageResponse.from(m, ragService.parseCitations(m.getCitations())))
            .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(User owner, UUID sessionId, SendMessageRequest req) {
        ChatSession session = sessionRepository.findByIdAndOwner(sessionId, owner)
            .orElseThrow(() -> new NotFoundException("Chat session not found"));
        List<ChatMessage> history = messageRepository.findBySessionOrderByCreatedAtAsc(session);

        ChatMessage userMsg = ChatMessage.builder()
            .session(session)
            .role(ChatMessage.Role.USER)
            .content(req.content().trim())
            .build();
        messageRepository.save(userMsg);

        ChatAnswer answer = ragService.answer(owner, history, req.content().trim());

        ChatMessage botMsg = ChatMessage.builder()
            .session(session)
            .role(ChatMessage.Role.ASSISTANT)
            .content(answer.answer())
            .citations(ragService.citationsJson(answer.citations()))
            .build();
        ChatMessage saved = messageRepository.save(botMsg);

        if ("New Chat".equals(session.getTitle())) {
            String first = req.content().trim();
            session.setTitle(first.length() > 60 ? first.substring(0, 57) + "..." : first);
        }
        sessionRepository.save(session);

        return ChatMessageResponse.from(saved, answer.citations());
    }

    @Transactional
    public void deleteSession(User owner, UUID sessionId) {
        ChatSession session = sessionRepository.findByIdAndOwner(sessionId, owner)
            .orElseThrow(() -> new NotFoundException("Chat session not found"));
        messageRepository.deleteBySessionId(session.getId());
        sessionRepository.delete(session);
    }
}
