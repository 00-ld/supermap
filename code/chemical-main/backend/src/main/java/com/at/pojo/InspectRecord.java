package com.at.pojo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InspectRecord {
    private Long id;
    private LocalDateTime createTime;
    private Integer personCount;
    private String location;
    private String status;
    private String imageBase64;
    private Integer analysisTime;
}