package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/** 创建任务请求体，对应后端 TaskCreateDTO。 */
public class TaskCreateRequest {
    @SerializedName("title") private String title;
    @SerializedName("description") private String description;
    @SerializedName("type") private String type;
    @SerializedName("warningHistoryId") private Integer warningHistoryId;
    @SerializedName("gasType") private String gasType;
    @SerializedName("assigneeType") private String assigneeType;
    @SerializedName("carId") private Integer carId;
    @SerializedName("employeeId") private Long employeeId;
    @SerializedName("x") private Double x;
    @SerializedName("y") private Double y;
    @SerializedName("areaName") private String areaName;

    public TaskCreateRequest(String title, String description, Integer warningHistoryId,
                             String assigneeType, Integer carId, Long employeeId) {
        this.title = title;
        this.description = description;
        this.type = "incident";
        this.warningHistoryId = warningHistoryId;
        this.assigneeType = assigneeType;
        this.carId = carId;
        this.employeeId = employeeId;
    }
}
