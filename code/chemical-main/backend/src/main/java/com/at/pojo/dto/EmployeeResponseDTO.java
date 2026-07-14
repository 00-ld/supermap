package com.at.pojo.dto;

import com.at.pojo.Employee;

import java.time.LocalDateTime;

public record EmployeeResponseDTO(
        Long id,
        String name,
        Integer age,
        Integer gender,
        String phone,
        String department,
        Integer employeeNo,
        String status,
        String jobDesc,
        LocalDateTime createTime
) {
    public static EmployeeResponseDTO fromEntity(Employee employee) {
        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getName(),
                employee.getAge(),
                employee.getGender(),
                employee.getPhone(),
                employee.getDepartment(),
                employee.getEmployeeNo(),
                employee.getStatus(),
                employee.getJobDesc(),
                employee.getCreateTime()
        );
    }
}
