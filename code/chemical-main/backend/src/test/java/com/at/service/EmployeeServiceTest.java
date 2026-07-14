package com.at.service;

import com.at.mapper.EmployeeMapper;
import com.at.pojo.Employee;
import com.at.pojo.dto.EmployeeSaveDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void updateEmployeeRejectsMissingRow() {
        EmployeeSaveDTO dto = buildEmployeeSaveDTO();
        when(employeeMapper.update(argThat(employee -> employee.getId().equals(404L))))
                .thenReturn(0);

        assertThatThrownBy(() -> employeeService.updateEmployee(404L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee does not exist: 404");

        verify(employeeMapper).update(argThat(employee -> employee.getId().equals(404L)));
    }

    @Test
    void createEmployeeRejectsDuplicateEmployeeNoBeforeInsert() {
        EmployeeSaveDTO dto = buildEmployeeSaveDTO();
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmployeeNo(dto.getEmployeeNo());
        when(employeeMapper.selectByEmployeeNo(dto.getEmployeeNo())).thenReturn(existing);

        assertThatThrownBy(() -> employeeService.createEmployee(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee number already exists: 1001");

        verify(employeeMapper, never()).insert(any(Employee.class));
    }

    @Test
    void createEmployeeRejectsZeroInsertedRows() {
        EmployeeSaveDTO dto = buildEmployeeSaveDTO();
        when(employeeMapper.insert(any(Employee.class))).thenReturn(0);

        assertThatThrownBy(() -> employeeService.createEmployee(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("员工保存失败");

        verify(employeeMapper).insert(any(Employee.class));
    }

    @Test
    void updateEmployeeRejectsEmployeeNoOwnedByAnotherRow() {
        EmployeeSaveDTO dto = buildEmployeeSaveDTO();
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmployeeNo(dto.getEmployeeNo());
        when(employeeMapper.selectByEmployeeNo(dto.getEmployeeNo())).thenReturn(existing);

        assertThatThrownBy(() -> employeeService.updateEmployee(2L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee number already exists: 1001");

        verify(employeeMapper, never()).update(any(Employee.class));
    }

    @Test
    void deleteEmployeeReturnsFalseWhenNoRowsDeleted() {
        when(employeeMapper.deleteById(404L)).thenReturn(0);

        org.assertj.core.api.Assertions.assertThat(employeeService.deleteEmployee(404L)).isFalse();
    }

    @Test
    void deleteEmployeeReturnsTrueWhenRowsDeleted() {
        when(employeeMapper.deleteById(7L)).thenReturn(1);

        org.assertj.core.api.Assertions.assertThat(employeeService.deleteEmployee(7L)).isTrue();
    }

    private EmployeeSaveDTO buildEmployeeSaveDTO() {
        EmployeeSaveDTO dto = new EmployeeSaveDTO();
        dto.setName("Alice");
        dto.setAge(30);
        dto.setGender(2);
        dto.setPhone("13800000000");
        dto.setDepartment("安全部");
        dto.setEmployeeNo(1001);
        dto.setStatus("在岗");
        dto.setJobDesc("巡检");
        return dto;
    }
}
