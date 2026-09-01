package com.at.pojo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 指派请求体。pending → assigned。car/employee 二选一，由 service 校验对应主键存在。
 */
@Data
public class TaskAssignDTO {

    @NotNull(message = "taskId 不能为空")
    private Long taskId;

    @Pattern(regexp = "car|employee", message = "指派对象只能是 car/employee")
    private String assigneeType;

    private Integer carId;
    private Long employeeId;
}
