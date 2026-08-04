package com.at.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Loads the approved local response documents without exposing their paths to the browser. */
@Service
public class EvidenceDocumentService {
    private static final int MAX_DOCUMENT_CHARS = 60_000;
    private static final int MAX_TOTAL_CHARS = 110_000;
    private static final String REPOSITORY_DOCUMENT = "docs/chemical-park-leak-emergency-response.md";

    @Value("${decision-model.evidence-paths:}")
    private String configuredPaths;

    public EvidenceBundle load() {
        List<EvidenceDocument> documents = new ArrayList<>();
        String[] paths = configuredPaths == null ? new String[0] : configuredPaths.split(";", -1);
        boolean configured = addConfiguredFiles(documents, paths);
        if (!configured) addClasspathFile(documents);

        int total = 0;
        List<EvidenceDocument> limited = new ArrayList<>();
        for (EvidenceDocument document : documents) {
            if (total >= MAX_TOTAL_CHARS) break;
            int remaining = MAX_TOTAL_CHARS - total;
            String content = document.content().substring(0, Math.min(document.content().length(), remaining));
            limited.add(new EvidenceDocument(document.name(), content, document.available()));
            total += content.length();
        }
        return new EvidenceBundle(List.copyOf(limited));
    }

    private boolean addConfiguredFiles(List<EvidenceDocument> documents, String[] paths) {
        boolean configured = false;
        for (String path : paths) {
            if (path == null || path.isBlank()) continue;
            String selected = path.trim();
            if (!selected.toLowerCase().endsWith(".md")) continue;
            configured = true;
            String name = Path.of(selected).getFileName().toString();
            try {
                Path file = Path.of(selected).toAbsolutePath().normalize();
                if (!Files.isRegularFile(file)) {
                    documents.add(new EvidenceDocument(name, "文件未找到：不能声称已引用该文件。", false));
                    continue;
                }
                documents.add(new EvidenceDocument(name + " [" + file + "]", readLimited(file), true));
            } catch (Exception exception) {
                documents.add(new EvidenceDocument(name, "文件读取失败：不能声称已引用该文件。", false));
            }
        }
        return configured;
    }

    private void addClasspathFile(List<EvidenceDocument> documents) {
        try {
            ClassPathResource resource = new ClassPathResource(REPOSITORY_DOCUMENT);
            if (!resource.exists()) {
                documents.add(new EvidenceDocument(REPOSITORY_DOCUMENT, "仓库依据文件不存在。", false));
                return;
            }
            String content;
            try (var input = resource.getInputStream()) {
                content = new String(input.readAllBytes(), StandardCharsets.UTF_8);
            }
            documents.add(new EvidenceDocument(REPOSITORY_DOCUMENT,
                    content.substring(0, Math.min(MAX_DOCUMENT_CHARS, content.length())), true));
        } catch (IOException exception) {
            documents.add(new EvidenceDocument(REPOSITORY_DOCUMENT, "仓库依据文件读取失败。", false));
        }
    }

    private String readLimited(Path path) throws IOException {
        try (var reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            StringBuilder builder = new StringBuilder();
            char[] buffer = new char[4096];
            int read;
            while (builder.length() < MAX_DOCUMENT_CHARS
                    && (read = reader.read(buffer, 0, Math.min(buffer.length, MAX_DOCUMENT_CHARS - builder.length()))) >= 0) {
                builder.append(buffer, 0, read);
            }
            return builder.toString();
        }
    }

    public record EvidenceBundle(List<EvidenceDocument> documents) {
        public String asPromptText() {
            StringBuilder text = new StringBuilder();
            for (EvidenceDocument document : documents) {
                text.append("\n--- 依据文件: ").append(document.name()).append("; 可用=")
                        .append(document.available()).append(" ---\n")
                        .append(document.content()).append("\n--- 依据文件结束 ---\n");
            }
            return text.toString();
        }

        public List<String> names() {
            return documents.stream().filter(EvidenceDocument::available).map(EvidenceDocument::name).toList();
        }
    }

    public record EvidenceDocument(String name, String content, boolean available) {
    }
}
