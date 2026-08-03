package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 后端统一响应体，对应 com.at.pojo.Result<T>。
 * 字段：{code, message, data, ok, timestamp, requestId}
 */
public class ApiResult<T> {
    @SerializedName("code")
    private Integer code;

    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private T data;

    @SerializedName("ok")
    private boolean ok;

    @SerializedName("timestamp")
    private long timestamp;

    @SerializedName("requestId")
    private String requestId;

    public boolean isSuccess() {
        return ok && code != null && code == 200;
    }

    public Integer getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
    public boolean isOk() { return ok; }
    public String getRequestId() { return requestId; }
}
