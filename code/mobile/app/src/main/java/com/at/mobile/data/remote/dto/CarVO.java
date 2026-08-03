package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 巡检车，对应后端 com.at.pojo.Car。
 * x/y 是园区本地米制（INT），warning: 0=正常 1=预警。
 */
public class CarVO {
    @SerializedName("id") private Integer id;
    @SerializedName("carId") private Integer carId;
    @SerializedName("warning") private Integer warning;
    @SerializedName("x") private Integer x;
    @SerializedName("y") private Integer y;
    @SerializedName("gasType") private String gasType;

    public Integer getId() { return id; }
    public Integer getCarId() { return carId; }
    public Integer getWarning() { return warning; }
    public Integer getX() { return x; }
    public Integer getY() { return y; }
    public String getGasType() { return gasType; }
    public boolean isWarning() { return warning != null && warning == 1; }
}
