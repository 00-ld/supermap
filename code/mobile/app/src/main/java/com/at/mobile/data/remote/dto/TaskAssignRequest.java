package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/** 指派请求体，对应后端 TaskAssignDTO。 */
public class TaskAssignRequest {
    @SerializedName("taskId") private Long taskId;
    @SerializedName("assigneeType") private String assigneeType;
    @SerializedName("carId") private Integer carId;
    @SerializedName("employeeId") private Long employeeId;

    public TaskAssignRequest(Long taskId, String assigneeType, Integer carId, Long employeeId) {
        this.taskId = taskId;
        this.assigneeType = assigneeType;
        this.carId = carId;
        this.employeeId = employeeId;
    }
}
