package com.at.pojo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 现场打卡请求体。processing → pending_review。
 * 照片走 multipart 单独上传，不在此 DTO；坐标为 WGS84 经纬度，由移动端定位获取。
 */
@Data
public class TaskCheckinDTO {

    @NotNull(message = "taskId 不能为空")
    private Long taskId;

    private Double checkinX;
    private Double checkinY;
    private String checkinRemark;
}
