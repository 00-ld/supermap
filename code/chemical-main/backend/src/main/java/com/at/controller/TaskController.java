package com.at.controller;

import com.at.annotation.RequiresRole;
import com.at.pojo.Result;
import com.at.pojo.Task;
import com.at.pojo.dto.IntIdDTO;
import com.at.pojo.dto.TaskAssignDTO;
import com.at.pojo.dto.TaskCheckinDTO;
import com.at.pojo.dto.TaskCreateDTO;
import com.at.pojo.dto.TaskQueryDTO;
import com.at.pojo.dto.TaskResponseDTO;
import com.at.pojo.dto.TaskReviewDTO;
import com.at.service.TaskService;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 任务指派接口。管理员可创建/指派/验收/取消，普通用户接单与打卡。
 * userId 由 TokenInterceptor 解析 JWT 后写入 request attribute。
 */
@Slf4j
@RestController
@RequestMapping("/api/task")
public class TaskController {

    @Resource
    private TaskService taskService;

    @PostMapping
    @RequiresRole("admin")
    public Result<TaskResponseDTO> create(@Valid @RequestBody TaskCreateDTO dto,
                                          @RequestAttribute(value = "userId", required = false) Long userId) {
        Task task = taskService.createTask(dto, userId);
        log.info("创建任务 id={}, 创建人={}", task.getId(), userId);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/assign")
    @RequiresRole("admin")
    public Result<TaskResponseDTO> assign(@Valid @RequestBody TaskAssignDTO dto) {
        Task task = taskService.assignTask(dto);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/accept")
    public Result<TaskResponseDTO> accept(@Valid @RequestBody IntIdDTO dto,
                                          @RequestAttribute(value = "userId", required = false) Long userId) {
        Task task = taskService.acceptTask(dto.getId().longValue(), userId);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/checkin")
    public Result<TaskResponseDTO> checkin(@Valid @ModelAttribute TaskCheckinDTO dto,
                                           @RequestParam(value = "photo", required = false) MultipartFile photo,
                                           @RequestAttribute(value = "userId", required = false) Long userId) {
        Task task = taskService.checkin(dto, photo, userId);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/review")
    @RequiresRole("admin")
    public Result<TaskResponseDTO> review(@Valid @RequestBody TaskReviewDTO dto,
                                          @RequestAttribute(value = "userId", required = false) Long userId) {
        Task task = taskService.reviewTask(dto, userId);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/cancel")
    @RequiresRole("admin")
    public Result<?> cancel(@Valid @RequestBody IntIdDTO dto) {
        taskService.cancelTask(dto.getId().longValue());
        return Result.success("任务已取消");
    }

    @GetMapping("/list")
    public Result<List<TaskResponseDTO>> list(@Valid @ModelAttribute TaskQueryDTO query) {
        List<Task> list = taskService.listTasks(query);
        return Result.success(list.stream().map(TaskResponseDTO::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public Result<TaskResponseDTO> detail(@PathVariable Long id) {
        Task task = taskService.getTaskDetail(id);
        return Result.success(TaskResponseDTO.fromEntity(task));
    }

    @GetMapping("/my")
    public Result<List<TaskResponseDTO>> myTasks(@RequestParam(required = false) String assigneeType,
                                                  @RequestParam(required = false) Long employeeId,
                                                  @RequestParam(required = false) Integer carId) {
        List<Task> list = taskService.myTasks(assigneeType, employeeId, carId);
        return Result.success(list.stream().map(TaskResponseDTO::fromEntity).toList());
    }
}
