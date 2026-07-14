package com.at.pojo;

import java.time.LocalDateTime;

public class SensorLayout {
    private Integer id;
    private String layoutName;
    private String description;
    private Integer sensorCount;
    private Double coverageRate;
    private Double riskScore;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getLayoutName() { return layoutName; }
    public void setLayoutName(String layoutName) { this.layoutName = layoutName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getSensorCount() { return sensorCount; }
    public void setSensorCount(Integer sensorCount) { this.sensorCount = sensorCount; }

    public Double getCoverageRate() { return coverageRate; }
    public void setCoverageRate(Double coverageRate) { this.coverageRate = coverageRate; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
