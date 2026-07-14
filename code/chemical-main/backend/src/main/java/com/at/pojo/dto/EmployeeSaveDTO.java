package com.at.pojo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 员工信息新增/更新的请求体（admin 权限），新增与更新共用。
 * gender：1=男 2=女；status：在岗/休假/离职。
 */
@Data
public class EmployeeSaveDTO {

    @NotBlank(message = "员工姓名不能为空")
    private String name;

    @NotNull(message = "年龄不能为空")
    @Min(value = 18, message = "年龄不能小于18")
    @Max(value = 60, message = "年龄不能大于60")
    private Integer age;

    @NotNull(message = "性别不能为空")
    @Min(value = 1, message = "性别只能为 1=男 或 2=女")
    @Max(value = 2, message = "性别只能为 1=男 或 2=女")
    private Integer gender;

    @NotBlank(message = "联系电话不能为空")
    private String phone;

    @NotBlank(message = "所属部门不能为空")
    private String department;

    @NotNull(message = "工号不能为空")
    private Integer employeeNo;

    @NotBlank(message = "在岗状态不能为空")
    @Pattern(regexp = "^(在岗|休假|离职)$", message = "在岗状态只能为 在岗、休假 或 离职")
    private String status;

    @NotBlank(message = "岗位职责不能为空")
    private String jobDesc;
}
