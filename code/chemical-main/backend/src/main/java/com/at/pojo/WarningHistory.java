package com.at.pojo;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WarningHistory {
    private Integer id;
    private Integer carId;
    private String areaName;
    private Integer x;
    private Integer y;
    private String gasType;
    private Double gasValue;
    private LocalDateTime warningTime;
}