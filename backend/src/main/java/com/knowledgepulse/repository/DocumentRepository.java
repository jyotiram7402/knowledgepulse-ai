package com.knowledgepulse.repository;

import com.knowledgepulse.entity.Document;
import com.knowledgepulse.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findByOwnerOrderByCreatedAtDesc(User owner, Pageable pageable);

    List<Document> findByOwnerOrderByCreatedAtDesc(User owner);

    Optional<Document> findByIdAndOwner(UUID id, User owner);

    long countByOwner(User owner);

    @Query("""
        SELECT d FROM Document d
        WHERE d.owner = :owner
          AND LOWER(d.filename) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY d.createdAt DESC
    """)
    List<Document> searchByOwnerAndFilename(@Param("owner") User owner, @Param("query") String query);
}
