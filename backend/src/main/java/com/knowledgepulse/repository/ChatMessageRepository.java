package com.knowledgepulse.repository;

import com.knowledgepulse.entity.ChatMessage;
import com.knowledgepulse.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    List<ChatMessage> findBySessionOrderByCreatedAtAsc(ChatSession session);

    long count();

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.session.id = :sessionId")
    void deleteBySessionId(@Param("sessionId") UUID sessionId);
}
