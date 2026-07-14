package com.at.pojo.dto;

import com.at.pojo.InspectRecord;

import java.time.LocalDateTime;

public record InspectRecordResponseDTO(
        Long id,
        LocalDateTime createTime,
        Integer personCount,
        String location,
        String status,
        String imageBase64,
        Integer analysisTime
) {
    public static InspectRecordResponseDTO fromEntity(InspectRecord record) {
        return new InspectRecordResponseDTO(
                record.getId(),
                record.getCreateTime(),
                record.getPersonCount(),
                record.getLocation(),
                record.getStatus(),
                record.getImageBase64(),
                record.getAnalysisTime()
        );
    }
}
