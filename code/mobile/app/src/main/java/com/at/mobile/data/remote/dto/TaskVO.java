package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 任务，对应后端 TaskResponseDTO。
 * 状态机：pending→assigned→processing→pending_review→completed/canceled。
 */
public class TaskVO {
    @SerializedName("id") private Long id;
    @SerializedName("title") private String title;
    @SerializedName("description") private String description;
    @SerializedName("type") private String type;
    @SerializedName("status") private String status;
    @SerializedName("warningHistoryId") private Integer warningHistoryId;
    @SerializedName("gasType") private String gasType;
    @SerializedName("assigneeType") private String assigneeType;
    @SerializedName("carId") private Integer carId;
    @SerializedName("employeeId") private Long employeeId;
    @SerializedName("x") private Double x;
    @SerializedName("y") private Double y;
    @SerializedName("areaName") private String areaName;
    @SerializedName("creatorUserId") private Long creatorUserId;
    @SerializedName("assignedTime") private String assignedTime;
    @SerializedName("acceptedTime") private String acceptedTime;
    @SerializedName("checkinTime") private String checkinTime;
    @SerializedName("checkinX") private Double checkinX;
    @SerializedName("checkinY") private Double checkinY;
    @SerializedName("yoloPersonCount") private Integer yoloPersonCount;
    @SerializedName("checkinRemark") private String checkinRemark;
    @SerializedName("reviewResult") private String reviewResult;
    @SerializedName("reviewRemark") private String reviewRemark;
    @SerializedName("reviewTime") private String reviewTime;
    @SerializedName("reviewerUserId") private Long reviewerUserId;
    @SerializedName("warningResolved") private Integer warningResolved;
    @SerializedName("source") private String source;
    @SerializedName("createdAt") private String createdAt;
    @SerializedName("updatedAt") private String updatedAt;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public Integer getWarningHistoryId() { return warningHistoryId; }
    public String getGasType() { return gasType; }
    public String getAssigneeType() { return assigneeType; }
    public Integer getCarId() { return carId; }
    public Long getEmployeeId() { return employeeId; }
    public Double getX() { return x; }
    public Double getY() { return y; }
    public String getAreaName() { return areaName; }
    public String getAssignedTime() { return assignedTime; }
    public String getAcceptedTime() { return acceptedTime; }
    public String getReviewTime() { return reviewTime; }
    public String getCheckinTime() { return checkinTime; }
    public Integer getYoloPersonCount() { return yoloPersonCount; }
    public String getCheckinRemark() { return checkinRemark; }
    public String getReviewResult() { return reviewResult; }
    public String getReviewRemark() { return reviewRemark; }
    public Integer getWarningResolved() { return warningResolved; }
    public String getCreatedAt() { return createdAt; }
}
