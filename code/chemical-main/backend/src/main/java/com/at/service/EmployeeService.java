package com.at.service;

import com.at.mapper.EmployeeMapper;
import com.at.pojo.Employee;
import com.at.pojo.dto.EmployeeSaveDTO;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class EmployeeService {

    @Resource
    private EmployeeMapper employeeMapper;

    public List<Employee> listEmployees() {
        List<Employee> list = employeeMapper.selectList();
        log.info("查询员工列表, 数量: {}", list.size());
        return list;
    }

    public Employee createEmployee(EmployeeSaveDTO dto) {
        ensureEmployeeNoAvailable(dto.getEmployeeNo(), null);
        Employee employee = toEntity(new Employee(), dto);
        int rows = employeeMapper.insert(employee);
        if (rows <= 0) {
            throw new IllegalStateException("员工保存失败");
        }
        log.info("创建员工成功: id={}, name={}, affectedRows={}", employee.getId(), employee.getName(), rows);
        return employee;
    }

    public Employee updateEmployee(Long id, EmployeeSaveDTO dto) {
        ensureEmployeeNoAvailable(dto.getEmployeeNo(), id);
        Employee employee = toEntity(new Employee(), dto);
        employee.setId(id);
        int rows = employeeMapper.update(employee);
        log.info("更新员工, id={}, 实际更新行数: {}", id, rows);
        if (rows == 0) {
            throw new IllegalArgumentException("Employee does not exist: " + id);
        }
        return employee;
    }

    public boolean deleteEmployee(Long id) {
        int rows = employeeMapper.deleteById(id);
        log.info("删除员工, id={}, 实际删除行数: {}", id, rows);
        return rows > 0;
    }

    private Employee toEntity(Employee employee, EmployeeSaveDTO dto) {
        employee.setName(dto.getName());
        employee.setAge(dto.getAge());
        employee.setGender(dto.getGender());
        employee.setPhone(dto.getPhone());
        employee.setDepartment(dto.getDepartment());
        employee.setEmployeeNo(dto.getEmployeeNo());
        employee.setStatus(dto.getStatus());
        employee.setJobDesc(dto.getJobDesc());
        return employee;
    }

    private void ensureEmployeeNoAvailable(Integer employeeNo, Long currentEmployeeId) {
        Employee existing = employeeMapper.selectByEmployeeNo(employeeNo);
        if (existing != null && !Objects.equals(existing.getId(), currentEmployeeId)) {
            throw new IllegalArgumentException("Employee number already exists: " + employeeNo);
        }
    }
}
