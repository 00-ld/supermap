package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.Task;
import com.at.pojo.dto.IntIdDTO;
import com.at.pojo.dto.TaskAssignDTO;
import com.at.pojo.dto.TaskCreateDTO;
import com.at.pojo.dto.TaskResponseDTO;
import com.at.pojo.dto.TaskReviewDTO;
import com.at.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    private TaskController controller;

    @BeforeEach
    void setUp() {
        controller = new TaskController();
        ReflectionTestUtils.setField(controller, "taskService", taskService);
    }

    @Test
    void createReturnsResponseDtoFromServiceResult() {
        TaskCreateDTO dto = new TaskCreateDTO();
        dto.setTitle("泄漏处置");
        Task task = new Task();
        task.setId(1L);
        task.setTitle("泄漏处置");
        task.setStatus("pending");
        when(taskService.createTask(any(), anyLong())).thenReturn(task);

        Result<TaskResponseDTO> body = controller.create(dto, 7L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData().id()).isEqualTo(1L);
        verify(taskService).createTask(dto, 7L);
    }

    @Test
    void detailReturnsResponseDtoForId() {
        Task task = new Task();
        task.setId(42L);
        task.setStatus("completed");
        when(taskService.getTaskDetail(42L)).thenReturn(task);

        Result<TaskResponseDTO> body = controller.detail(42L);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData().id()).isEqualTo(42L);
        assertThat(body.getData().status()).isEqualTo("completed");
    }

    @Test
    void listMapsEntitiesToResponseDtos() {
        Task task = new Task();
        task.setId(1L);
        task.setStatus("assigned");
        when(taskService.listTasks(any())).thenReturn(List.of(task));

        Result<List<TaskResponseDTO>> body = controller.list(null);

        assertThat(body.isOk()).isTrue();
        assertThat(body.getData()).hasSize(1);
        assertThat(body.getData().get(0).status()).isEqualTo("assigned");
    }

    @Test
    void cancelDelegatesToServiceAndReturnsOk() {
        IntIdDTO dto = new IntIdDTO();
        dto.setId(5);

        Result<?> body = controller.cancel(dto);

        assertThat(body.isOk()).isTrue();
        verify(taskService).cancelTask(5L);
    }

    @Test
    void writeOperationsAreAdminGuarded() throws Exception {
        // 创建/指派/验收/取消必须 @RequiresRole("admin")，接单与打卡登录即可
        assertThat(roleOf("create")).isEqualTo("admin");
        assertThat(roleOf("assign")).isEqualTo("admin");
        assertThat(roleOf("review")).isEqualTo("admin");
        assertThat(roleOf("cancel")).isEqualTo("admin");

        assertThat(roleOf("accept")).isNull();
        assertThat(roleOf("checkin")).isNull();
        assertThat(roleOf("detail")).isNull();
        assertThat(roleOf("list")).isNull();
        assertThat(roleOf("myTasks")).isNull();
    }

    private String roleOf(String methodName) throws Exception {
        for (Method method : TaskController.class.getDeclaredMethods()) {
            if (method.getName().equals(methodName)) {
                RequiresRole annotation = method.getAnnotation(RequiresRole.class);
                return annotation == null ? null : annotation.value();
            }
        }
        throw new IllegalStateException("方法不存在: " + methodName);
    }
}
