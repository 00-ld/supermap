package com.at.service.impl;

import com.at.exception.ApiException;
import com.at.mapper.CarMapper;
import com.at.mapper.EmployeeMapper;
import com.at.mapper.TaskMapper;
import com.at.mapper.WarningHistoryMapper;
import com.at.pojo.Car;
import com.at.pojo.Employee;
import com.at.pojo.Task;
import com.at.pojo.WarningHistory;
import com.at.pojo.dto.TaskAssignDTO;
import com.at.pojo.dto.TaskCheckinDTO;
import com.at.pojo.dto.TaskCreateDTO;
import com.at.pojo.dto.TaskReviewDTO;
import com.at.service.ImageAnalysisException;
import com.at.service.ImageAnalysisService;
import com.alibaba.fastjson.JSONObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * TaskServiceImpl 状态机与闭环逻辑测试。重点覆盖 CAS 并发竞争、异常解除幂等、YOLO 降级、非法转移。
 */
@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskMapper taskMapper;
    @Mock
    private WarningHistoryMapper warningHistoryMapper;
    @Mock
    private CarMapper carMapper;
    @Mock
    private EmployeeMapper employeeMapper;
    @Mock
    private ImageAnalysisService imageAnalysisService;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void createTaskRedundancesWarningFieldsAndStaysPendingWithoutAssignee() {
        TaskCreateDTO dto = new TaskCreateDTO();
        dto.setTitle("A7 区泄漏处置");
        dto.setWarningHistoryId(11);
        WarningHistory warning = new WarningHistory();
        warning.setId(11);
        warning.setCarId(2);
        warning.setGasType("CH4");
        warning.setX(1230);
        warning.setY(880);
        warning.setAreaName("南区");
        when(warningHistoryMapper.selectById(11)).thenReturn(warning);

        taskService.createTask(dto, 1L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).insert(captor.capture());
        Task saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo("pending");
        assertThat(saved.getGasType()).isEqualTo("CH4");
        assertThat(saved.getX()).isEqualTo(1230.0);
        assertThat(saved.getY()).isEqualTo(880.0);
        assertThat(saved.getAreaName()).isEqualTo("南区");
        assertThat(saved.getWarningResolved()).isEqualTo(0);
        assertThat(saved.getWarningHistoryId()).isEqualTo(11);
        assertThat(saved.getCreatorUserId()).isEqualTo(1L);
    }

    @Test
    void createTaskWithCarAssigneeGoesStraightToAssigned() {
        TaskCreateDTO dto = new TaskCreateDTO();
        dto.setTitle("现场核查");
        dto.setAssigneeType("car");
        dto.setCarId(3);
        Car car = new Car();
        car.setCarId(3);
        when(carMapper.getByCarId(3)).thenReturn(car);

        taskService.createTask(dto, 1L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).insert(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("assigned");
        assertThat(captor.getValue().getCarId()).isEqualTo(3);
        assertThat(captor.getValue().getAssignedTime()).isNotNull();
    }

    @Test
    void createTaskRejectsUnknownWarningHistory() {
        TaskCreateDTO dto = new TaskCreateDTO();
        dto.setTitle("x");
        dto.setWarningHistoryId(999);
        when(warningHistoryMapper.selectById(999)).thenReturn(null);

        assertThatThrownBy(() -> taskService.createTask(dto, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void assignTaskAdvancesPendingToAssignedAndWritesAssignee() {
        Task pending = task(7L, "pending");
        when(taskMapper.selectById(7L)).thenReturn(pending);
        when(taskMapper.updateStatus(7L, "pending", "assigned")).thenReturn(1);

        TaskAssignDTO dto = new TaskAssignDTO();
        dto.setTaskId(7L);
        dto.setAssigneeType("car");
        dto.setCarId(1);
        Car car = new Car();
        car.setCarId(1);
        when(carMapper.getByCarId(1)).thenReturn(car);

        Task assigned = task(7L, "assigned");
        assigned.setCarId(1);
        when(taskMapper.selectById(7L)).thenReturn(pending, assigned);

        taskService.assignTask(dto);

        verify(taskMapper).updateAssignee(any(Task.class));
    }

    @Test
    void assignTaskThrows409WhenCasFailsDueToConcurrentChange() {
        Task pending = task(7L, "pending");
        when(taskMapper.selectById(7L)).thenReturn(pending);
        when(taskMapper.updateStatus(7L, "pending", "assigned")).thenReturn(0);

        TaskAssignDTO dto = new TaskAssignDTO();
        dto.setTaskId(7L);
        dto.setAssigneeType("car");
        dto.setCarId(1);
        Car car = new Car();
        car.setCarId(1);
        when(carMapper.getByCarId(1)).thenReturn(car);

        assertThatThrownBy(() -> taskService.assignTask(dto))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("任务状态已变更");
    }

    @Test
    void checkinAdvancesProcessingToPendingReviewAndStoresYoloResult() {
        Task processing = task(9L, "processing");
        when(taskMapper.selectById(9L)).thenReturn(processing);
        when(taskMapper.updateStatus(9L, "processing", "pending_review")).thenReturn(1);

        JSONObject analysis = new JSONObject();
        analysis.put("count", 3);
        analysis.put("image_base64", "base64-bytes");
        when(imageAnalysisService.analyzePerson(any())).thenReturn(analysis);

        TaskCheckinDTO dto = new TaskCheckinDTO();
        dto.setTaskId(9L);
        dto.setCheckinX(113.56);
        dto.setCheckinY(34.76);
        dto.setCheckinRemark("未见异常");
        MockMultipartFile photo = new MockMultipartFile("photo", "a.jpg", "image/jpeg", new byte[]{1, 2});

        taskService.checkin(dto, photo, 5L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).updateCheckin(captor.capture());
        Task updated = captor.getValue();
        assertThat(updated.getYoloPersonCount()).isEqualTo(3);
        assertThat(updated.getCheckinPhotoBase64()).isEqualTo("base64-bytes");
        assertThat(updated.getCheckinRemark()).isEqualTo("未见异常");
        assertThat(updated.getCheckinTime()).isNotNull();
    }

    @Test
    void checkinDegradesGracefullyWhenAlgorithmServiceUnavailable() {
        Task processing = task(9L, "processing");
        when(taskMapper.selectById(9L)).thenReturn(processing);
        when(taskMapper.updateStatus(9L, "processing", "pending_review")).thenReturn(1);
        when(imageAnalysisService.analyzePerson(any()))
                .thenThrow(new ImageAnalysisException(503, "人员识别服务未配置"));

        TaskCheckinDTO dto = new TaskCheckinDTO();
        dto.setTaskId(9L);
        MockMultipartFile photo = new MockMultipartFile("photo", "a.jpg", "image/jpeg", new byte[]{1});

        taskService.checkin(dto, photo, 5L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).updateCheckin(captor.capture());
        Task updated = captor.getValue();
        // 降级：照片照存（这里未单独存原始 base64，但流程不阻塞），人数为空
        assertThat(updated.getYoloPersonCount()).isNull();
    }

    @Test
    void reviewPassResolvesWarningByResettingCarAndMarkingResolved() {
        Task pendingReview = task(12L, "pending_review");
        pendingReview.setWarningHistoryId(20);
        pendingReview.setCarId(2);
        pendingReview.setWarningResolved(0);
        when(taskMapper.selectById(12L)).thenReturn(pendingReview);
        when(taskMapper.updateStatus(12L, "pending_review", "completed")).thenReturn(1);
        when(carMapper.resetStatus(2)).thenReturn(1);

        TaskReviewDTO dto = new TaskReviewDTO();
        dto.setTaskId(12L);
        dto.setReviewResult("pass");

        taskService.reviewTask(dto, 1L);

        verify(carMapper).resetStatus(2);
        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).updateReview(captor.capture());
        assertThat(captor.getValue().getWarningResolved()).isEqualTo(1);
        assertThat(captor.getValue().getReviewResult()).isEqualTo("pass");
    }

    @Test
    void reviewPassIsIdempotentAndDoesNotResetTwice() {
        Task pendingReview = task(12L, "pending_review");
        pendingReview.setWarningHistoryId(20);
        pendingReview.setCarId(2);
        pendingReview.setWarningResolved(1); // 已解除
        when(taskMapper.selectById(12L)).thenReturn(pendingReview);
        when(taskMapper.updateStatus(12L, "pending_review", "completed")).thenReturn(1);

        TaskReviewDTO dto = new TaskReviewDTO();
        dto.setTaskId(12L);
        dto.setReviewResult("pass");

        taskService.reviewTask(dto, 1L);

        verify(carMapper, never()).resetStatus(any());
    }

    @Test
    void reviewRejectRollsBackToProcessing() {
        Task pendingReview = task(12L, "pending_review");
        when(taskMapper.selectById(12L)).thenReturn(pendingReview);
        when(taskMapper.updateStatus(12L, "pending_review", "processing")).thenReturn(1);

        TaskReviewDTO dto = new TaskReviewDTO();
        dto.setTaskId(12L);
        dto.setReviewResult("reject");
        dto.setReviewRemark("照片模糊");

        taskService.reviewTask(dto, 1L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskMapper).updateReview(captor.capture());
        assertThat(captor.getValue().getReviewResult()).isEqualTo("reject");
        verify(carMapper, never()).resetStatus(any());
    }

    @Test
    void cancelRejectsTaskAlreadyInProcessing() {
        Task processing = task(15L, "processing");
        when(taskMapper.selectById(15L)).thenReturn(processing);

        assertThatThrownBy(() -> taskService.cancelTask(15L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不可取消");
    }

    @Test
    void cancelAllowsPendingTask() {
        Task pending = task(15L, "pending");
        when(taskMapper.selectById(15L)).thenReturn(pending);
        when(taskMapper.updateStatus(15L, "pending", "canceled")).thenReturn(1);

        taskService.cancelTask(15L);

        verify(taskMapper).updateStatus(15L, "pending", "canceled");
    }

    private Task task(Long id, String status) {
        Task task = new Task();
        task.setId(id);
        task.setStatus(status);
        return task;
    }
}
