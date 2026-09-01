package com.at.pojo.dto;

import lombok.Data;

/**
 * 任务列表查询条件。全部字段可空，空则不过滤。
 */
@Data
public class TaskQueryDTO {

    private String status;
    private String assigneeType;
    private Integer carId;
    private Long employeeId;
    private Integer warningHistoryId;
    private String keyword;
}
