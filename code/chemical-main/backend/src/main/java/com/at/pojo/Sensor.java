package com.at.pojo;

import java.time.LocalDateTime;

public class Sensor {
    private String id;
    private Double x;
    private Double y;
    private Double installationHeight;
    private Double effectiveRange;
    private String detectionRange;
    private String installRemark;
    private Integer priority;
    private Double risk;
    private String type;
    private String mode;
    private Long lastSampleTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }

    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }

    public Double getInstallationHeight() { return installationHeight; }
    public void setInstallationHeight(Double installationHeight) { this.installationHeight = installationHeight; }

    public Double getEffectiveRange() { return effectiveRange; }
    public void setEffectiveRange(Double effectiveRange) { this.effectiveRange = effectiveRange; }

    public String getDetectionRange() { return detectionRange; }
    public void setDetectionRange(String detectionRange) { this.detectionRange = detectionRange; }

    public String getInstallRemark() { return installRemark; }
    public void setInstallRemark(String installRemark) { this.installRemark = installRemark; }

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }

    public Double getRisk() { return risk; }
    public void setRisk(Double risk) { this.risk = risk; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public Long getLastSampleTime() { return lastSampleTime; }
    public void setLastSampleTime(Long lastSampleTime) { this.lastSampleTime = lastSampleTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
