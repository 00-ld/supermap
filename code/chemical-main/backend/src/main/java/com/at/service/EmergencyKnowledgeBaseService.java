package com.at.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
public class EmergencyKnowledgeBaseService {
    private static final List<String> INCIDENT_TERMS = List.of(
            "液氨", "氨气", "氯气", "硫化氢", "可燃气", "有毒气", "泄漏",
            "中毒", "窒息", "疏散", "警戒", "火灾", "爆炸", "储罐", "人员",
            "头晕", "风向", "应急", "堵漏", "洗消", "环境"
    );

    private final Path catalogPath;
    private volatile List<CatalogDocument> cachedDocuments;

    public EmergencyKnowledgeBaseService(
            @Value("${qwen.knowledge-base-path:}") String knowledgeBasePath
    ) {
        this.catalogPath = knowledgeBasePath == null || knowledgeBasePath.isBlank()
                ? null
                : Path.of(knowledgeBasePath).resolve("05_索引与校验").resolve("document-catalog.csv");
    }

    public List<EmergencyKnowledgeEvidence> search(String scenario, int limit) {
        if (scenario == null || scenario.isBlank() || limit <= 0) {
            return List.of();
        }
        String normalizedScenario = scenario.toLowerCase(Locale.ROOT);
        return documents().stream()
                .map(document -> new ScoredDocument(document, relevanceScore(document, normalizedScenario)))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingInt(ScoredDocument::score).reversed())
                .limit(Math.min(limit, 5))
                .map(scored -> new EmergencyKnowledgeEvidence(
                        scored.document().title(),
                        scored.document().relativePath(),
                        truncate(scored.document().sampleText(), 560)))
                .toList();
    }

    private List<CatalogDocument> documents() {
        List<CatalogDocument> current = cachedDocuments;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (cachedDocuments == null) {
                cachedDocuments = loadDocuments();
            }
            return cachedDocuments;
        }
    }

    private List<CatalogDocument> loadDocuments() {
        if (catalogPath == null || !Files.isRegularFile(catalogPath)) {
            return List.of();
        }
        try {
            List<List<String>> records = parseCsv(Files.readString(catalogPath, StandardCharsets.UTF_8));
            if (records.size() < 2) {
                return List.of();
            }
            List<String> header = new ArrayList<>(records.getFirst());
            if (!header.isEmpty()) {
                header.set(0, header.getFirst().replace("\uFEFF", ""));
            }
            int fileIndex = header.indexOf("file");
            int categoryIndex = header.indexOf("category");
            int titleIndex = header.indexOf("title");
            int sampleIndex = header.indexOf("sample_text");
            if (fileIndex < 0 || titleIndex < 0 || sampleIndex < 0) {
                return List.of();
            }
            return records.stream().skip(1)
                    .filter(record -> record.size() > Math.max(sampleIndex, titleIndex))
                    .map(record -> new CatalogDocument(
                            valueAt(record, fileIndex),
                            valueAt(record, categoryIndex),
                            valueAt(record, titleIndex),
                            valueAt(record, sampleIndex)))
                    .filter(document -> !document.title().isBlank())
                    .toList();
        } catch (IOException | RuntimeException exception) {
            log.warn("应急知识库索引加载失败: type={}", exception.getClass().getSimpleName());
            return List.of();
        }
    }

    private int relevanceScore(CatalogDocument document, String scenario) {
        String title = document.title().toLowerCase(Locale.ROOT);
        String category = document.category().toLowerCase(Locale.ROOT);
        String sample = document.sampleText().toLowerCase(Locale.ROOT);
        int score = 0;
        for (String term : INCIDENT_TERMS) {
            if (!scenario.contains(term)) {
                continue;
            }
            if (title.contains(term)) score += 6;
            if (sample.contains(term)) score += 3;
            if (category.contains(term)) score += 1;
        }
        return score;
    }

    private static String valueAt(List<String> record, int index) {
        return index >= 0 && index < record.size() ? record.get(index).trim() : "";
    }

    private static String truncate(String value, int maximumLength) {
        if (value == null || value.length() <= maximumLength) return value == null ? "" : value;
        return value.substring(0, maximumLength) + "…";
    }

    private static List<List<String>> parseCsv(String content) {
        List<List<String>> records = new ArrayList<>();
        List<String> record = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < content.length(); index++) {
            char character = content.charAt(index);
            if (character == '"') {
                if (quoted && index + 1 < content.length() && content.charAt(index + 1) == '"') {
                    field.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (character == ',' && !quoted) {
                record.add(field.toString());
                field.setLength(0);
            } else if ((character == '\n' || character == '\r') && !quoted) {
                if (character == '\r' && index + 1 < content.length() && content.charAt(index + 1) == '\n') index++;
                record.add(field.toString());
                field.setLength(0);
                if (!record.stream().allMatch(String::isBlank)) records.add(record);
                record = new ArrayList<>();
            } else {
                field.append(character);
            }
        }
        record.add(field.toString());
        if (!record.stream().allMatch(String::isBlank)) records.add(record);
        return records;
    }

    private record CatalogDocument(String relativePath, String category, String title, String sampleText) {
    }

    private record ScoredDocument(CatalogDocument document, int score) {
    }
}
