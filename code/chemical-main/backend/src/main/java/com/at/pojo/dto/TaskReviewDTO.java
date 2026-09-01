package com.at.pojo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 验收请求体。pending_review → completed(pass) 或 → processing(reject 驳回重做)。
 */
@Data
public class TaskReviewDTO {

    @NotNull(message = "taskId 不能为空")
    private Long taskId;

    @Pattern(regexp = "pass|reject", message = "验收结果只能是 pass/reject")
    private String reviewResult;

    private String reviewRemark;
}
