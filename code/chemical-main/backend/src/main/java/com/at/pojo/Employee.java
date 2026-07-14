package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 员工信息。取代前端 personnelDirectory 本地假数据，入库为真实数据源。
 * gender：1=男 2=女；status：在岗/休假/离职。
 */
@Data
public class Employee {
    private Long id;
    private String name;
    private Integer age;
    private Integer gender;
    private String phone;
    private String department;
    private Integer employeeNo;
    private String status;
    private String jobDesc;
    private LocalDateTime createTime;
}
