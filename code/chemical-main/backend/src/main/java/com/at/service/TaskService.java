package com.at.service;

import com.at.pojo.Task;
import com.at.pojo.dto.TaskAssignDTO;
import com.at.pojo.dto.TaskCheckinDTO;
import com.at.pojo.dto.TaskCreateDTO;
import com.at.pojo.dto.TaskQueryDTO;
import com.at.pojo.dto.TaskReviewDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 任务指派服务：贯穿"事故→指派→打卡→验收→异常解除"全闭环。
 * 所有状态转移走 CAS 原语，并发安全。
 */
public interface TaskService {

    /** 创建任务。带 warningHistoryId 时冗余告警字段；带指派信息时 status=assigned，否则 pending。 */
    Task createTask(TaskCreateDTO dto, Long creatorUserId);

    /** 指派：pending → assigned。 */
    Task assignTask(TaskAssignDTO dto);

    /** 接单：assigned → processing。 */
    Task acceptTask(Long taskId, Long currentUserId);

    /** 打卡：processing → pending_review。算法不可用时降级，照片照存。 */
    Task checkin(TaskCheckinDTO dto, MultipartFile photo, Long currentUserId);

    /** 验收：pass → completed（触发异常解除）；reject → processing（驳回重做）。 */
    Task reviewTask(TaskReviewDTO dto, Long reviewerUserId);

    /** 取消：pending/assigned → canceled。 */
    void cancelTask(Long taskId);

    /** 详情。 */
    Task getTaskDetail(Long id);

    /** 列表查询。 */
    List<Task> listTasks(TaskQueryDTO query);

    /** 我的任务。 */
    List<Task> myTasks(String assigneeType, Long employeeId, Integer carId);
}
