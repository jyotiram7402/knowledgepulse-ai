package com.knowledgepulse.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "knowledgepulse")
public class AppProperties {
    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Admin admin = new Admin();
    private Gemini gemini = new Gemini();
    private Cloudinary cloudinary = new Cloudinary();
    private Rag rag = new Rag();

    @Data
    public static class Jwt {
        private String secret;
        private long expirationMs = 86_400_000L;
        private String issuer = "knowledgepulse-ai";
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";
    }

    @Data
    public static class Admin {
        private String email;
        private String password;
    }

    @Data
    public static class Gemini {
        private String apiKey;
        private String chatModel = "gemini-1.5-flash";
        private String embeddingModel = "text-embedding-004";
        private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
        private int embeddingDimensions = 768;
    }

    @Data
    public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
        private String folder = "knowledgepulse";
    }

    @Data
    public static class Rag {
        private int chunkSize = 900;
        private int chunkOverlap = 150;
        private int topK = 5;
        private double similarityThreshold = 0.20;
    }
}
