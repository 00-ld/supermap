package com.at.mobile.util;

import androidx.annotation.Nullable;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * 事故耗时与任务阶段时长计算。
 *
 * <p>后端时间字符串格式统一 ISO-like "yyyy-MM-dd HH:mm:ss"（MySQL DATETIME 序列化），
 * 时区为服务器本地（与园区一致）。本类只做差值，不涉及时区转换。</p>
 */
public final class TimeElapsed {

    /** 后端 DATETIME 序列化格式。 */
    private static final String SERVER_FORMAT = "yyyy-MM-dd HH:mm:ss";
    /** 超时阈值：事故持续超 30 分钟即提示。 */
    private static final long INCIDENT_WARN_MINUTES = 30;
    /** 任务处置超时阈值：processing 超 2 小时提示。 */
    private static final long PROCESSING_WARN_HOURS = 2;

    private TimeElapsed() {
    }

    /** 解析后端时间字符串，失败返回 null。 */
    @Nullable
    public static Date parse(String time) {
        if (time == null || time.trim().isEmpty()) {
            return null;
        }
        try {
            return new SimpleDateFormat(SERVER_FORMAT, Locale.CHINA).parse(time);
        } catch (ParseException e) {
            // 兼容带 T 的 ISO 8601
            try {
                String normalized = time.replace("T", " ");
                if (normalized.length() > 19) {
                    normalized = normalized.substring(0, 19);
                }
                return new SimpleDateFormat(SERVER_FORMAT, Locale.CHINA).parse(normalized);
            } catch (ParseException ignored) {
                return null;
            }
        }
    }

    /** 两个时间点间的耗时字符串（如 "12 分钟" / "1 小时 30 分" / "2 天 5 小时"）。 */
    public static String duration(long fromMs, long toMs) {
        long diffMs = Math.max(0, toMs - fromMs);
        long minutes = TimeUnit.MILLISECONDS.toMinutes(diffMs);
        if (minutes < 60) {
            return minutes + " 分钟";
        }
        long hours = minutes / 60;
        long remainMinutes = minutes % 60;
        if (hours < 24) {
            return hours + " 小时 " + remainMinutes + " 分";
        }
        long days = hours / 24;
        long remainHours = hours % 24;
        return days + " 天 " + remainHours + " 小时";
    }

    /** 事故从 warningTime 到现在已持续时长字符串。 */
    public static String incidentElapsed(String warningTime) {
        Date start = parse(warningTime);
        if (start == null) {
            return "--";
        }
        return duration(start.getTime(), System.currentTimeMillis());
    }

    /** 事故是否超 30 分钟需预警。 */
    public static boolean isIncidentTimeout(String warningTime) {
        Date start = parse(warningTime);
        if (start == null) {
            return false;
        }
        long minutes = TimeUnit.MILLISECONDS.toMinutes(System.currentTimeMillis() - start.getTime());
        return minutes >= INCIDENT_WARN_MINUTES;
    }

    /** 任务 processing 状态是否超 2 小时需预警，acceptedTime 为空则用 createdAt 兜底。 */
    public static boolean isProcessingTimeout(String acceptedTime, String createdAt) {
        Date start = parse(acceptedTime);
        if (start == null) {
            start = parse(createdAt);
        }
        if (start == null) {
            return false;
        }
        long hours = TimeUnit.MILLISECONDS.toHours(System.currentTimeMillis() - start.getTime());
        return hours >= PROCESSING_WARN_HOURS;
    }
}
