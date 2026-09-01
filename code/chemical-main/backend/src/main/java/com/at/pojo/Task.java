package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务指派实体。一张表贯穿"事故→指派→打卡→验收→异常解除"全闭环。
 *
 * <p>状态机：pending(待指派) → assigned(已指派) → processing(处置中) →
 * pending_review(待验收) → completed(已完成)；任意未完成态可 canceled(已取消)。
 * 验收驳回 review(reject) 回退到 processing。
 *
 * <p>关联列允许 NULL，不加 FK 约束，与既有 warning_history/patrol_car 一致。
 * warning_resolved 是异常解除幂等标志：验收通过且 warning_history_id 非空时复位 patrol_car.warning，
 * 复位后置 1，重复验收不重复复位。
 */
@Data
public class Task {

    private Long id;
    private String title;
    private String description;
    private String type;
    private String status;

    private Integer warningHistoryId;
    private String gasType;

    private String assigneeType;
    private Integer carId;
    private Long employeeId;

    private Double x;
    private Double y;
    private String areaName;

    private Long creatorUserId;
    private LocalDateTime assignedTime;
    private LocalDateTime acceptedTime;

    private LocalDateTime checkinTime;
    private Double checkinX;
    private Double checkinY;
    private String checkinPhotoBase64;
    private Integer yoloPersonCount;
    private String checkinRemark;

    private String reviewResult;
    private String reviewRemark;
    private LocalDateTime reviewTime;
    private Long reviewerUserId;

    private Integer warningResolved;
    private Long inspectRecordId;
    private String source;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
