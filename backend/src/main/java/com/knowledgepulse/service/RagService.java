package com.knowledgepulse.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgepulse.config.AppProperties;
import com.knowledgepulse.dto.ChatAnswer;
import com.knowledgepulse.dto.Citation;
import com.knowledgepulse.entity.ChatMessage;
import com.knowledgepulse.entity.User;
import com.knowledgepulse.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private static final String SYSTEM_INSTRUCTION = """
        You are KnowledgePulse AI, an enterprise knowledge assistant.
        Answer ONLY using the provided context snippets.
        If the answer cannot be found in the context, say:
        "I could not find that information in your knowledge base."
        After your answer, never invent citations - use only the [n] markers shown.
        Be concise, factual, and professional.
        """;

    private final DocumentChunkRepository chunkRepository;
    private final GeminiService geminiService;
    private final VectorFormatter vectorFormatter;
    private final AppProperties props;
    private final ObjectMapper mapper;

    public ChatAnswer answer(User owner, List<ChatMessage> history, String question) {
        float[] queryEmbedding = geminiService.embed(question);
        String queryVec = vectorFormatter.toPgvector(queryEmbedding);

        List<Object[]> rows = chunkRepository.findSimilarForOwner(
            owner.getId().toString(), queryVec, props.getRag().getTopK());

        List<Citation> citations = new ArrayList<>();
        StringBuilder context = new StringBuilder();
        int idx = 1;
        for (Object[] r : rows) {
            String chunkId = String.valueOf(r[0]);
            String documentId = String.valueOf(r[1]);
            int chunkIndex = ((Number) r[3]).intValue();
            String content = String.valueOf(r[4]);
            double distance = ((Number) r[6]).doubleValue();
            double similarity = 1.0 - distance;
            if (similarity < props.getRag().getSimilarityThreshold() && !citations.isEmpty()) continue;

            context.append("[").append(idx).append("] ").append(content).append("\n\n");
            citations.add(new Citation(idx, chunkId, documentId, chunkIndex, similarity, snippet(content)));
            idx++;
        }

        String prompt;
        if (citations.isEmpty()) {
            prompt = "The user's knowledge base contains no relevant context for this question.\n"
                + "Politely tell them no relevant information was found.\n\nQuestion: " + question;
        } else {
            prompt = "Context snippets:\n\n" + context + "\nQuestion: " + question;
        }

        List<GeminiService.Turn> turns = new ArrayList<>();
        for (ChatMessage m : history) {
            String role = m.getRole() == ChatMessage.Role.USER ? "user" : "model";
            turns.add(new GeminiService.Turn(role, m.getContent()));
        }
        turns.add(new GeminiService.Turn("user", prompt));

        String text = geminiService.chat(turns, SYSTEM_INSTRUCTION);
        return new ChatAnswer(text, citations);
    }

    public String citationsJson(List<Citation> citations) {
        try {
            return mapper.writeValueAsString(citations);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize citations", e);
            return "[]";
        }
    }

    public List<Citation> parseCitations(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            Citation[] arr = mapper.readValue(json, Citation[].class);
            return List.of(arr);
        } catch (Exception e) {
            return List.of();
        }
    }

    private String snippet(String content) {
        String trimmed = content.replaceAll("\\s+", " ").trim();
        return trimmed.length() <= 240 ? trimmed : trimmed.substring(0, 240) + "...";
    }

    public Map<String, Object> stats(User owner) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("topK", props.getRag().getTopK());
        out.put("chunkSize", props.getRag().getChunkSize());
        out.put("chunkOverlap", props.getRag().getChunkOverlap());
        return out;
    }
}
