package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 通用整型 id 请求体，对应后端 IntIdDTO（accept/cancel 复用）。
 *
 * <p>后端 DTO 字段是 Integer，但 task.id 在数据库是 BIGINT。为避免移动端在调用链中
 * 强转 int 导致 ID 超过 Integer.MAX_VALUE 时溢出丢值，本类提供 long 构造。
 * 序列化为 JSON 时是数值字面量，后端 Integer 反序列化在 ID ≤ 2^31-1 时正常，
 * 超出时后端会抛解析异常暴露问题而非静默截断。</p>
 */
public class IntIdRequest {
    @SerializedName("id") private final Long id;

    public IntIdRequest(Integer id) {
        this.id = id == null ? null : id.longValue();
    }

    public IntIdRequest(long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }
}
