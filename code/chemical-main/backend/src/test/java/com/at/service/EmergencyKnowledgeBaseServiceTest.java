package com.at.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmergencyKnowledgeBaseServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void ranksDocumentsThatMatchTheIncidentSubstanceAndResponseAction() throws IOException {
        Path indexDir = Files.createDirectories(tempDir.resolve("05_索引与校验"));
        Files.writeString(indexDir.resolve("document-catalog.csv"), String.join("\n",
                "\uFEFFfile,category,title,pages,bytes,sha256,sample_text",
                "01_预案与方案\\ammonia.pdf,预案,液氨泄漏应急处置预案,10,1,x,液氨泄漏后应立即从上风向疏散并设置警戒区",
                "03_事故案例\\fire.pdf,案例,一般火灾调查报告,8,1,y,厂房火灾事故调查"));

        EmergencyKnowledgeBaseService service = new EmergencyKnowledgeBaseService(tempDir.toString());

        var evidence = service.search("液氨泄漏，有人员头晕，需要疏散", 2);

        assertEquals(1, evidence.size());
        assertEquals("液氨泄漏应急处置预案", evidence.getFirst().title());
        assertTrue(evidence.getFirst().excerpt().contains("上风向疏散"));
    }
}
