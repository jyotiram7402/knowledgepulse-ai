package com.knowledgepulse.service;

import com.knowledgepulse.dto.AdminDocumentResponse;
import com.knowledgepulse.dto.AdminStatsResponse;
import com.knowledgepulse.dto.UserResponse;
import com.knowledgepulse.repository.ChatMessageRepository;
import com.knowledgepulse.repository.ChatSessionRepository;
import com.knowledgepulse.repository.DocumentChunkRepository;
import com.knowledgepulse.repository.DocumentRepository;
import com.knowledgepulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDocumentResponse> listDocuments() {
        return documentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream().map(AdminDocumentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(
            userRepository.count(),
            userRepository.countByEnabled(true),
            documentRepository.count(),
            chunkRepository.count(),
            sessionRepository.count(),
            messageRepository.count()
        );
    }
}
