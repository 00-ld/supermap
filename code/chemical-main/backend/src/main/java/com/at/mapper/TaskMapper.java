package com.at.mapper;

import com.at.pojo.Task;
import com.at.pojo.dto.TaskQueryDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaskMapper {

    /** 新增任务，useGeneratedKeys 回填 id。 */
    int insert(Task task);

    /** 按主键更新全部可变字段（动态 set，仅更新非 null 字段）。 */
    int updateById(Task task);

    /** 按主键查询。 */
    Task selectById(Long id);

    /** 多条件动态查询。 */
    List<Task> selectByQuery(TaskQueryDTO query);

    /** 按指派对象查询（我的任务）。carId/employeeId 可为空，由 XML 判空。 */
    List<Task> selectByAssignee(@Param("assigneeType") String assigneeType,
                                @Param("employeeId") Long employeeId,
                                @Param("carId") Integer carId);

    /**
     * 状态机 CAS 原语：仅当当前 status=fromStatus 时才更新为 toStatus。
     * 返回影响行数：1 成功，0 表示状态已被并发改动。
     */
    int updateStatus(@Param("id") Long id,
                     @Param("fromStatus") String fromStatus,
                     @Param("toStatus") String toStatus);

    /** 指派：写 assignee_* + assigned_time + status=assigned（已由 updateStatus 改状态，此处补字段）。 */
    int updateAssignee(Task task);

    /** 打卡：写 checkin_* + yolo_person_count + status=pending_review。 */
    int updateCheckin(Task task);

    /** 验收：写 review_* + warning_resolved（异常解除标志）。 */
    int updateReview(Task task);
}
