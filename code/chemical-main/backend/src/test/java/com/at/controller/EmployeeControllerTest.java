package com.at.controller;

import com.at.pojo.Employee;
import com.at.pojo.Result;
import com.at.pojo.dto.EmployeeResponseDTO;
import com.at.pojo.dto.EmployeeSaveDTO;
import com.at.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    @Mock
    private EmployeeService employeeService;

    private EmployeeController controller;

    @BeforeEach
    void setUp() {
        controller = new EmployeeController();
        ReflectionTestUtils.setField(controller, "employeeService", employeeService);
    }

    @Test
    void listReturnsResponseDtosWithoutExposingEntities() {
        Employee employee = employee(7L, "张工", LocalDateTime.of(2026, 6, 18, 10, 0));
        when(employeeService.listEmployees()).thenReturn(List.of(employee));

        Result<List<EmployeeResponseDTO>> body = controller.list();

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).containsExactly(employeeResponse(7L, "张工", LocalDateTime.of(2026, 6, 18, 10, 0)));
        verify(employeeService).listEmployees();
    }

    @Test
    void createReturnsResponseDtoWithoutExposingEntity() {
        EmployeeSaveDTO dto = employeeDto("李工");
        Employee employee = employee(8L, "李工", LocalDateTime.of(2026, 6, 18, 11, 0));
        when(employeeService.createEmployee(dto)).thenReturn(employee);

        Result<EmployeeResponseDTO> body = controller.create(dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(employeeResponse(8L, "李工", LocalDateTime.of(2026, 6, 18, 11, 0)));
        verify(employeeService).createEmployee(dto);
    }

    @Test
    void updateReturnsResponseDtoWithoutExposingEntity() {
        EmployeeSaveDTO dto = employeeDto("王工");
        Employee employee = employee(9L, "王工", null);
        when(employeeService.updateEmployee(9L, dto)).thenReturn(employee);

        Result<EmployeeResponseDTO> body = controller.update(9L, dto);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo(employeeResponse(9L, "王工", null));
        verify(employeeService).updateEmployee(9L, dto);
    }

    @Test
    void deleteReturnsBadRequestWhenEmployeeDoesNotExist() {
        when(employeeService.deleteEmployee(404L)).thenReturn(false);

        Result<?> body = controller.delete(404L);

        assertThat(body.isOk()).isFalse();
        assertThat(body.getMessage()).isEqualTo("员工不存在");
        verify(employeeService).deleteEmployee(404L);
    }

    @Test
    void deleteReturnsOkWhenEmployeeWasDeleted() {
        when(employeeService.deleteEmployee(7L)).thenReturn(true);

        Result<?> body = controller.delete(7L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).isEqualTo("员工已删除");
        verify(employeeService).deleteEmployee(7L);
    }

    private Employee employee(Long id, String name, LocalDateTime createTime) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setName(name);
        employee.setAge(36);
        employee.setGender(1);
        employee.setPhone("13800000000");
        employee.setDepartment("安全部");
        employee.setEmployeeNo(1007);
        employee.setStatus("在岗");
        employee.setJobDesc("现场巡检");
        employee.setCreateTime(createTime);
        return employee;
    }

    private EmployeeResponseDTO employeeResponse(Long id, String name, LocalDateTime createTime) {
        return new EmployeeResponseDTO(
                id,
                name,
                36,
                1,
                "13800000000",
                "安全部",
                1007,
                "在岗",
                "现场巡检",
                createTime
        );
    }

    private EmployeeSaveDTO employeeDto(String name) {
        EmployeeSaveDTO dto = new EmployeeSaveDTO();
        dto.setName(name);
        dto.setAge(36);
        dto.setGender(1);
        dto.setPhone("13800000000");
        dto.setDepartment("安全部");
        dto.setEmployeeNo(1007);
        dto.setStatus("在岗");
        dto.setJobDesc("现场巡检");
        return dto;
    }
}
