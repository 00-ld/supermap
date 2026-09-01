package com.at.pojo.dto;

import com.at.pojo.Task;

import java.time.LocalDateTime;

/**
 * 任务响应体。对前端隐藏 inspectRecordId 等内部字段，保留闭环展示所需的全部信息。
 */
public record TaskResponseDTO(
        Long id,
        String title,
        String description,
        String type,
        String status,
        Integer warningHistoryId,
        String gasType,
        String assigneeType,
        Integer carId,
        Long employeeId,
        Double x,
        Double y,
        String areaName,
        Long creatorUserId,
        LocalDateTime assignedTime,
        LocalDateTime acceptedTime,
        LocalDateTime checkinTime,
        Double checkinX,
        Double checkinY,
        Integer yoloPersonCount,
        String checkinRemark,
        String reviewResult,
        String reviewRemark,
        LocalDateTime reviewTime,
        Long reviewerUserId,
        Integer warningResolved,
        String source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TaskResponseDTO fromEntity(Task task) {
        return new TaskResponseDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getType(),
                task.getStatus(),
                task.getWarningHistoryId(),
                task.getGasType(),
                task.getAssigneeType(),
                task.getCarId(),
                task.getEmployeeId(),
                task.getX(),
                task.getY(),
                task.getAreaName(),
                task.getCreatorUserId(),
                task.getAssignedTime(),
                task.getAcceptedTime(),
                task.getCheckinTime(),
                task.getCheckinX(),
                task.getCheckinY(),
                task.getYoloPersonCount(),
                task.getCheckinRemark(),
                task.getReviewResult(),
                task.getReviewRemark(),
                task.getReviewTime(),
                task.getReviewerUserId(),
                task.getWarningResolved(),
                task.getSource(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
