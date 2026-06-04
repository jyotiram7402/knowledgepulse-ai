package com.knowledgepulse.repository;

import com.knowledgepulse.entity.ChatSession;
import com.knowledgepulse.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findByOwnerOrderByUpdatedAtDesc(User owner);
    Optional<ChatSession> findByIdAndOwner(UUID id, User owner);
    long countByOwner(User owner);
}
