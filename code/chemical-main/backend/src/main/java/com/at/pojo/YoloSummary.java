package com.at.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YoloSummary {
    private Integer currentCount;
    private Integer analysisTime;
    private Integer riskCount;
    private Integer onlineDevices;
    private LocalDateTime lastAnalysisTime;
}
