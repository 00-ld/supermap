package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 告警历史，对应后端 com.at.pojo.WarningHistory。
 * 用于事故列表展示。
 */
public class WarningVO {
    @SerializedName("id") private Integer id;
    @SerializedName("carId") private Integer carId;
    @SerializedName("areaName") private String areaName;
    @SerializedName("x") private Integer x;
    @SerializedName("y") private Integer y;
    @SerializedName("gasType") private String gasType;
    @SerializedName("gasValue") private Double gasValue;
    @SerializedName("warningTime") private String warningTime;

    public Integer getId() { return id; }
    public Integer getCarId() { return carId; }
    public String getAreaName() { return areaName; }
    public Integer getX() { return x; }
    public Integer getY() { return y; }
    public String getGasType() { return gasType; }
    public Double getGasValue() { return gasValue; }
    public String getWarningTime() { return warningTime; }

    public String summary() {
        return (gasType == null ? "" : gasType)
                + (gasValue == null ? "" : " " + gasValue)
                + (areaName == null ? "" : " @" + areaName);
    }
}
