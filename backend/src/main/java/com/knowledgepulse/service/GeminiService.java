package com.knowledgepulse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knowledgepulse.config.AppProperties;
import com.knowledgepulse.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private final WebClient geminiWebClient;
    private final AppProperties props;
    private final ObjectMapper mapper;

    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            return new float[props.getGemini().getEmbeddingDimensions()];
        }
        String model = props.getGemini().getEmbeddingModel();
        String path = "/models/" + model + ":embedContent?key=" + props.getGemini().getApiKey();

        ObjectNode root = mapper.createObjectNode();
        root.put("model", "models/" + model);
        ObjectNode content = root.putObject("content");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", text);
        // gemini-embedding-001 defaults to 3072 dims; request the configured size
        // (768) so it matches the vector(768) column and pgvector's index limit.
        root.put("outputDimensionality", props.getGemini().getEmbeddingDimensions());

        try {
            JsonNode resp = geminiWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(root)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(45))
                .block();

            if (resp == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Empty embedding response");
            JsonNode values = resp.path("embedding").path("values");
            if (!values.isArray() || values.size() == 0) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Embedding response missing values");
            }
            float[] out = new float[values.size()];
            for (int i = 0; i < values.size(); i++) out[i] = (float) values.get(i).asDouble();
            return out;
        } catch (WebClientResponseException e) {
            log.error("Gemini embedding error: {} -> {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Embedding service error");
        }
    }

    public String chat(List<Turn> history, String systemInstruction) {
        String model = props.getGemini().getChatModel();
        String path = "/models/" + model + ":generateContent?key=" + props.getGemini().getApiKey();

        ObjectNode root = mapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        for (Turn t : history) {
            ObjectNode item = contents.addObject();
            item.put("role", t.role());
            ArrayNode parts = item.putArray("parts");
            parts.addObject().put("text", t.text());
        }
        if (systemInstruction != null && !systemInstruction.isBlank()) {
            ObjectNode sys = root.putObject("systemInstruction");
            ArrayNode parts = sys.putArray("parts");
            parts.addObject().put("text", systemInstruction);
        }
        ObjectNode genCfg = root.putObject("generationConfig");
        genCfg.put("temperature", 0.2);
        genCfg.put("topP", 0.9);
        genCfg.put("maxOutputTokens", 1024);

        try {
            JsonNode resp = geminiWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(root)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(60))
                .block();

            if (resp == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Empty chat response");
            JsonNode candidates = resp.path("candidates");
            if (!candidates.isArray() || candidates.size() == 0) {
                JsonNode promptFeedback = resp.path("promptFeedback");
                String reason = promptFeedback.path("blockReason").asText("unknown");
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini returned no candidates (" + reason + ")");
            }
            ArrayNode partsArr = (ArrayNode) candidates.get(0).path("content").path("parts");
            StringBuilder out = new StringBuilder();
            if (partsArr != null) {
                for (JsonNode p : partsArr) {
                    String text = p.path("text").asText("");
                    if (!text.isEmpty()) out.append(text);
                }
            }
            return out.toString().trim();
        } catch (WebClientResponseException e) {
            log.error("Gemini chat error: {} -> {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Chat service error");
        }
    }

    public List<Turn> emptyHistory() {
        return new ArrayList<>();
    }

    public record Turn(String role, String text) {}
}
