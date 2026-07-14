package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Employee;
import com.at.pojo.Result;
import com.at.pojo.dto.EmployeeResponseDTO;
import com.at.pojo.dto.EmployeeSaveDTO;
import com.at.service.EmployeeService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 员工信息管理。读列表登录即可，写操作（新增/更新/删除）要求 admin。
 */
@Slf4j
@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    @Resource
    private EmployeeService employeeService;

    @GetMapping("/list")
    public Result<List<EmployeeResponseDTO>> list() {
        List<Employee> list = employeeService.listEmployees();
        return Result.success(list.stream().map(EmployeeResponseDTO::fromEntity).toList());
    }

    @PostMapping
    @RequiresRole("admin")
    public Result<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeSaveDTO dto) {
        Employee employee = employeeService.createEmployee(dto);
        return Result.success(EmployeeResponseDTO.fromEntity(employee));
    }

    @PutMapping("/{id}")
    @RequiresRole("admin")
    public Result<EmployeeResponseDTO> update(@PathVariable Long id, @Valid @RequestBody EmployeeSaveDTO dto) {
        Employee employee = employeeService.updateEmployee(id, dto);
        return Result.success(EmployeeResponseDTO.fromEntity(employee));
    }

    @DeleteMapping("/{id}")
    @RequiresRole("admin")
    public Result<?> delete(@PathVariable Long id) {
        boolean deleted = employeeService.deleteEmployee(id);
        if (!deleted) {
            return Result.error(400, "员工不存在");
        }
        return Result.success("员工已删除");
    }
}
