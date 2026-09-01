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
import com.at.pojo.dto.TaskQueryDTO;
import com.at.pojo.dto.TaskReviewDTO;
import com.at.service.ImageAnalysisException;
import com.at.service.ImageAnalysisService;
import com.at.service.TaskService;
import com.alibaba.fastjson.JSONObject;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class TaskServiceImpl implements TaskService {

    /** 任务状态常量，避免散落字符串。 */
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_ASSIGNED = "assigned";
    private static final String STATUS_PROCESSING = "processing";
    private static final String STATUS_PENDING_REVIEW = "pending_review";
    private static final String STATUS_COMPLETED = "completed";
    private static final String STATUS_CANCELED = "canceled";

    private static final String ASSIGNEE_CAR = "car";
    private static final String ASSIGNEE_EMPLOYEE = "employee";

    private static final String REVIEW_PASS = "pass";
    private static final String REVIEW_REJECT = "reject";

    @Resource
    private TaskMapper taskMapper;

    @Resource
    private WarningHistoryMapper warningHistoryMapper;

    @Resource
    private CarMapper carMapper;

    @Resource
    private EmployeeMapper employeeMapper;

    @Resource
    private ImageAnalysisService imageAnalysisService;

    @Override
    public Task createTask(TaskCreateDTO dto, Long creatorUserId) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setType(dto.getType() == null ? "incident" : dto.getType());
        task.setCreatorUserId(creatorUserId);
        task.setSource("mobile");
        task.setWarningResolved(0);

        if (dto.getWarningHistoryId() != null) {
            WarningHistory warning = warningHistoryMapper.selectById(dto.getWarningHistoryId());
            if (warning == null) {
                throw new IllegalArgumentException("告警记录不存在: " + dto.getWarningHistoryId());
            }
            task.setWarningHistoryId(dto.getWarningHistoryId());
            // 冗余告警字段，任务卡片可直接展示，免二次查表
            task.setGasType(warning.getGasType());
            task.setX(warning.getX() == null ? null : warning.getX().doubleValue());
            task.setY(warning.getY() == null ? null : warning.getY().doubleValue());
            task.setAreaName(warning.getAreaName());
        } else {
            // 无告警来源时用 DTO 传入的坐标/气体类型
            task.setGasType(dto.getGasType());
            task.setX(dto.getX());
            task.setY(dto.getY());
            task.setAreaName(dto.getAreaName());
        }

        boolean assignAtCreate = dto.getAssigneeType() != null && !dto.getAssigneeType().isBlank();
        if (assignAtCreate) {
            validateAssignee(dto.getAssigneeType(), dto.getCarId(), dto.getEmployeeId());
            task.setAssigneeType(dto.getAssigneeType());
            task.setCarId(dto.getCarId());
            task.setEmployeeId(dto.getEmployeeId());
            task.setAssignedTime(LocalDateTime.now());
            task.setStatus(STATUS_ASSIGNED);
        } else {
            task.setStatus(STATUS_PENDING);
        }

        taskMapper.insert(task);
        log.info("创建任务 id={}, status={}, assigneeType={}", task.getId(), task.getStatus(), task.getAssigneeType());
        return task;
    }

    @Override
    public Task assignTask(TaskAssignDTO dto) {
        Task task = requireTask(dto.getTaskId());
        validateAssignee(dto.getAssigneeType(), dto.getCarId(), dto.getEmployeeId());

        int rows = taskMapper.updateStatus(dto.getTaskId(), STATUS_PENDING, STATUS_ASSIGNED);
        if (rows == 0) {
            throw conflict();
        }

        task.setAssigneeType(dto.getAssigneeType());
        task.setCarId(dto.getCarId());
        task.setEmployeeId(dto.getEmployeeId());
        task.setAssignedTime(LocalDateTime.now());
        taskMapper.updateAssignee(task);

        log.info("指派任务 id={} -> {}", dto.getTaskId(), dto.getAssigneeType());
        return taskMapper.selectById(dto.getTaskId());
    }

    @Override
    public Task acceptTask(Long taskId, Long currentUserId) {
        Task task = requireTask(taskId);
        int rows = taskMapper.updateStatus(taskId, STATUS_ASSIGNED, STATUS_PROCESSING);
        if (rows == 0) {
            throw conflict();
        }

        task.setAcceptedTime(LocalDateTime.now());
        taskMapper.updateById(task);

        log.info("接单任务 id={}, userId={}", taskId, currentUserId);
        return taskMapper.selectById(taskId);
    }

    @Override
    public Task checkin(TaskCheckinDTO dto, MultipartFile photo, Long currentUserId) {
        Task task = requireTask(dto.getTaskId());
        int rows = taskMapper.updateStatus(dto.getTaskId(), STATUS_PROCESSING, STATUS_PENDING_REVIEW);
        if (rows == 0) {
            throw conflict();
        }

        task.setCheckinTime(LocalDateTime.now());
        task.setCheckinX(dto.getCheckinX());
        task.setCheckinY(dto.getCheckinY());
        task.setCheckinRemark(dto.getCheckinRemark());

        // YOLO 复用：算法在线时拿人数+标注图；不可用降级，照片照存，不阻塞闭环
        if (photo != null && !photo.isEmpty()) {
            try {
                JSONObject analysis = imageAnalysisService.analyzePerson(photo);
                task.setCheckinPhotoBase64(analysis.getString("image_base64"));
                Integer personCount = analysis.getInteger("count");
                task.setYoloPersonCount(personCount);
                log.info("打卡 YOLO 识别完成 taskId={}, personCount={}", dto.getTaskId(), personCount);
            } catch (ImageAnalysisException exception) {
                log.warn("打卡 YOLO 降级 taskId={}, code={}, msg={}",
                        dto.getTaskId(), exception.getCode(), exception.getMessage());
            }
        }

        taskMapper.updateCheckin(task);
        log.info("打卡完成 taskId={}, userId={}", dto.getTaskId(), currentUserId);
        return taskMapper.selectById(dto.getTaskId());
    }

    @Override
    public Task reviewTask(TaskReviewDTO dto, Long reviewerUserId) {
        Task task = requireTask(dto.getTaskId());
        String result = dto.getReviewResult();

        if (REVIEW_PASS.equals(result)) {
            int rows = taskMapper.updateStatus(dto.getTaskId(), STATUS_PENDING_REVIEW, STATUS_COMPLETED);
            if (rows == 0) {
                throw conflict();
            }
            task.setReviewResult(REVIEW_PASS);
            task.setReviewRemark(dto.getReviewRemark());
            task.setReviewTime(LocalDateTime.now());
            task.setReviewerUserId(reviewerUserId);
            // 异常解除：验收通过且有告警来源，幂等复位 patrol_car.warning
            resolveWarningIfPending(task);
            taskMapper.updateReview(task);
            log.info("验收通过 taskId={}, warningResolved={}", dto.getTaskId(), task.getWarningResolved());
        } else if (REVIEW_REJECT.equals(result)) {
            int rows = taskMapper.updateStatus(dto.getTaskId(), STATUS_PENDING_REVIEW, STATUS_PROCESSING);
            if (rows == 0) {
                throw conflict();
            }
            task.setReviewResult(REVIEW_REJECT);
            task.setReviewRemark(dto.getReviewRemark());
            task.setReviewTime(LocalDateTime.now());
            task.setReviewerUserId(reviewerUserId);
            taskMapper.updateReview(task);
            log.info("验收驳回 taskId={}, 回退 processing", dto.getTaskId());
        } else {
            throw new IllegalArgumentException("验收结果非法: " + result);
        }
        return taskMapper.selectById(dto.getTaskId());
    }

    @Override
    public void cancelTask(Long taskId) {
        Task task = requireTask(taskId);
        // pending 或 assigned 才能取消
        boolean cancellable = STATUS_PENDING.equals(task.getStatus()) || STATUS_ASSIGNED.equals(task.getStatus());
        if (!cancellable) {
            throw new IllegalArgumentException("当前状态不可取消: " + task.getStatus());
        }
        int rows = taskMapper.updateStatus(taskId, task.getStatus(), STATUS_CANCELED);
        if (rows == 0) {
            throw conflict();
        }
        log.info("取消任务 id={}", taskId);
    }

    @Override
    public Task getTaskDetail(Long id) {
        return requireTask(id);
    }

    @Override
    public List<Task> listTasks(TaskQueryDTO query) {
        return taskMapper.selectByQuery(query);
    }

    @Override
    public List<Task> myTasks(String assigneeType, Long employeeId, Integer carId) {
        return taskMapper.selectByAssignee(assigneeType, employeeId, carId);
    }

    /** 异常解除：patrol_car.warning 复位 + task.warning_resolved=1，幂等。 */
    private void resolveWarningIfPending(Task task) {
        if (task.getWarningHistoryId() == null) {
            return;
        }
        if (task.getWarningResolved() != null && task.getWarningResolved() == 1) {
            return;
        }
        if (task.getCarId() != null) {
            carMapper.resetStatus(task.getCarId());
            log.info("异常解除：复位 patrol_car.warning, carId={}", task.getCarId());
        }
        task.setWarningResolved(1);
    }

    private void validateAssignee(String assigneeType, Integer carId, Long employeeId) {
        if (ASSIGNEE_CAR.equals(assigneeType)) {
            if (carId == null) {
                throw new IllegalArgumentException("指派小车时 carId 不能为空");
            }
            Car car = carMapper.getByCarId(carId);
            if (car == null) {
                throw new IllegalArgumentException("小车不存在: " + carId);
            }
        } else if (ASSIGNEE_EMPLOYEE.equals(assigneeType)) {
            if (employeeId == null) {
                throw new IllegalArgumentException("指派员工时 employeeId 不能为空");
            }
            Employee employee = employeeMapper.selectById(employeeId);
            if (employee == null) {
                throw new IllegalArgumentException("员工不存在: " + employeeId);
            }
        } else {
            throw new IllegalArgumentException("指派对象非法: " + assigneeType);
        }
    }

    private Task requireTask(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new IllegalArgumentException("任务不存在: " + id);
        }
        return task;
    }

    private ApiException conflict() {
        return new ApiException(HttpServletResponse.SC_CONFLICT, 409, "任务状态已变更，请刷新");
    }
}
