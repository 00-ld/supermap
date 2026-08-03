package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/** 验收请求体，对应后端 TaskReviewDTO。 */
public class TaskReviewRequest {
    @SerializedName("taskId") private Long taskId;
    @SerializedName("reviewResult") private String reviewResult;
    @SerializedName("reviewRemark") private String reviewRemark;

    public TaskReviewRequest(Long taskId, String reviewResult, String reviewRemark) {
        this.taskId = taskId;
        this.reviewResult = reviewResult;
        this.reviewRemark = reviewRemark;
    }
}
