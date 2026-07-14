package com.at.pojo;

import lombok.Data;

@Data
public class Car {
    private Integer id;         // 数据库主键
    private Integer carId;      // 小车ID
    private Integer warning;    // 0=正常 1=预警
    private Integer x;          // X坐标
    private Integer y;          // Y坐标
    private String gasType;     // 检测气体类型
}