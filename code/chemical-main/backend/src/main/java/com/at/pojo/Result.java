package com.at.pojo;

import com.at.context.RequestContext;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private Integer code;
    private String message;
    private T data;
    private boolean ok;
    private long timestamp;
    private String requestId;

    public static Result<Void> success() {
        return build(200, "成功", null, true);
    }

    public static <T> Result<T> success(T data) {
        return build(200, "成功", data, true);
    }

    public static Result<Void> error(String message) {
        return error(500, message);
    }

    public static Result<Void> error(Integer code, String message) {
        return build(code, message, null, false);
    }

    public static <T> Result<T> of(Integer code, String message, T data) {
        return build(code, message, data, code == 200);
    }

    private static <T> Result<T> build(Integer code, String message, T data, boolean ok) {
        return new Result<>(
                code,
                message,
                data,
                ok,
                Instant.now().toEpochMilli(),
                RequestContext.requestIdForResponse()
        );
    }
}
