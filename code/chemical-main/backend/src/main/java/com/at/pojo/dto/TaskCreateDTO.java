package com.at.pojo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 创建任务请求体。带 warningHistoryId 时由 service 校验存在并冗余 gasType/x/y/areaName。
 * 同时给出 assigneeType + carId/employeeId 则创建即指派（status=assigned），否则 pending 待指派。
 */
@Data
public class TaskCreateDTO {

    @NotBlank(message = "任务标题不能为空")
    private String title;

    private String description;

    @Pattern(regexp = "incident|patrol|drill", message = "任务类型只能是 incident/patrol/drill")
    private String type;

    private Integer warningHistoryId;
    private String gasType;

    @Pattern(regexp = "car|employee", message = "指派对象只能是 car/employee")
    private String assigneeType;
    private Integer carId;
    private Long employeeId;

    private Double x;
    private Double y;
    private String areaName;
}
