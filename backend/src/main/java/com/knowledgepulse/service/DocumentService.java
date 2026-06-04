package com.knowledgepulse.service;

import com.knowledgepulse.dto.DocumentResponse;
import com.knowledgepulse.entity.Document;
import com.knowledgepulse.entity.DocumentChunk;
import com.knowledgepulse.entity.User;
import com.knowledgepulse.exception.BadRequestException;
import com.knowledgepulse.exception.NotFoundException;
import com.knowledgepulse.repository.DocumentChunkRepository;
import com.knowledgepulse.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final long MAX_BYTES = 20L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXT = Set.of(".pdf", ".docx", ".txt", ".md");

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final CloudinaryService cloudinaryService;
    private final TextExtractionService textExtractionService;
    private final ChunkingService chunkingService;
    private final GeminiService geminiService;
    private final VectorFormatter vectorFormatter;

    @Transactional
    public DocumentResponse upload(User owner, MultipartFile file) {
        validate(file);

        String text = textExtractionService.extract(file);
        if (text == null || text.isBlank()) {
            throw new BadRequestException("No text content could be extracted from this file");
        }

        CloudinaryService.Upload uploaded = cloudinaryService.upload(file, owner.getId());

        Document doc = Document.builder()
            .owner(owner)
            .filename(file.getOriginalFilename() == null ? "untitled" : file.getOriginalFilename())
            .contentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
            .fileSize(file.getSize())
            .cloudinaryUrl(uploaded.url())
            .cloudinaryPublicId(uploaded.publicId())
            .status(Document.Status.PROCESSING)
            .chunkCount(0)
            .build();
        Document saved = documentRepository.save(doc);

        try {
            embedAndPersist(saved, text);
            saved.setStatus(Document.Status.READY);
        } catch (Exception e) {
            log.error("Embedding pipeline failed", e);
            saved.setStatus(Document.Status.FAILED);
            saved.setErrorMessage(e.getMessage());
        }
        return DocumentResponse.from(documentRepository.save(saved));
    }

    private void embedAndPersist(Document doc, String text) {
        List<String> chunks = chunkingService.chunk(text);
        int idx = 0;
        for (String chunk : chunks) {
            float[] embedding = geminiService.embed(chunk);
            DocumentChunk dc = DocumentChunk.builder()
                .document(doc)
                .owner(doc.getOwner())
                .chunkIndex(idx++)
                .content(chunk)
                .tokenCount(estimateTokens(chunk))
                .embedding(vectorFormatter.toPgvector(embedding))
                .build();
            chunkRepository.save(dc);
        }
        doc.setChunkCount(chunks.size());
    }

    private int estimateTokens(String s) {
        return Math.max(1, s.length() / 4);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> listForUser(User owner, Pageable pageable) {
        return documentRepository.findByOwnerOrderByCreatedAtDesc(owner, pageable).map(DocumentResponse::from);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> search(User owner, String query) {
        if (query == null || query.isBlank()) {
            return documentRepository.findByOwnerOrderByCreatedAtDesc(owner).stream().map(DocumentResponse::from).toList();
        }
        return documentRepository.searchByOwnerAndFilename(owner, query.trim())
            .stream().map(DocumentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse get(User owner, UUID id) {
        return documentRepository.findByIdAndOwner(id, owner)
            .map(DocumentResponse::from)
            .orElseThrow(() -> new NotFoundException("Document not found"));
    }

    @Transactional
    public void delete(User owner, UUID id) {
        Document doc = documentRepository.findByIdAndOwner(id, owner)
            .orElseThrow(() -> new NotFoundException("Document not found"));
        chunkRepository.deleteByDocumentId(doc.getId());
        cloudinaryService.delete(doc.getCloudinaryPublicId());
        documentRepository.delete(doc);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("File is required");
        if (file.getSize() > MAX_BYTES) throw new BadRequestException("File exceeds 20MB limit");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        boolean ok = ALLOWED_EXT.stream().anyMatch(name::endsWith);
        if (!ok) throw new BadRequestException("Allowed file types: PDF, DOCX, TXT, MD");
    }

    @Async
    public void reindex(UUID documentId) {
        log.info("Reindex requested for {}", documentId);
    }
}
