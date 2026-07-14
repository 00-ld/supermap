package com.at.pojo;

import java.time.LocalDateTime;

public class SensorLayoutDetail {
    private Integer id;
    private Integer layoutId;
    private String sensorId;
    private Double x;
    private Double y;
    private Double installationHeight;
    private Double effectiveRange;
    private String detectionRange;
    private Integer priority;
    private Double risk;
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getLayoutId() { return layoutId; }
    public void setLayoutId(Integer layoutId) { this.layoutId = layoutId; }

    public String getSensorId() { return sensorId; }
    public void setSensorId(String sensorId) { this.sensorId = sensorId; }

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

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }

    public Double getRisk() { return risk; }
    public void setRisk(Double risk) { this.risk = risk; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
