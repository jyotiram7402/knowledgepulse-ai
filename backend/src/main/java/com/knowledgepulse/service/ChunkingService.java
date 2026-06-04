package com.knowledgepulse.service;

import com.knowledgepulse.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChunkingService {

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private final AppProperties props;

    public List<String> chunk(String text) {
        if (text == null) return List.of();
        String normalized = normalize(text);
        if (normalized.isEmpty()) return List.of();

        int size = props.getRag().getChunkSize();
        int overlap = Math.min(props.getRag().getChunkOverlap(), size - 1);
        if (size <= 0) size = 900;
        if (overlap < 0) overlap = 0;

        List<String> chunks = new ArrayList<>();
        int len = normalized.length();
        int start = 0;
        while (start < len) {
            int end = Math.min(start + size, len);
            if (end < len) {
                int breakPoint = findBreakPoint(normalized, start + size / 2, end);
                if (breakPoint > start) end = breakPoint;
            }
            String piece = normalized.substring(start, end).trim();
            if (!piece.isEmpty()) chunks.add(piece);
            if (end >= len) break;
            start = Math.max(end - overlap, start + 1);
        }
        return chunks;
    }

    private int findBreakPoint(String text, int from, int to) {
        int lastSentence = -1;
        for (int i = to - 1; i >= from; i--) {
            char c = text.charAt(i);
            if (c == '.' || c == '!' || c == '?' || c == '\n') {
                lastSentence = i + 1;
                break;
            }
        }
        if (lastSentence > 0) return lastSentence;
        for (int i = to - 1; i >= from; i--) {
            if (text.charAt(i) == ' ') return i + 1;
        }
        return to;
    }

    private String normalize(String text) {
        Matcher m = WHITESPACE.matcher(text);
        return m.replaceAll(" ").trim();
    }
}
