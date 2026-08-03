package com.at.mobile.util;

/**
 * 打卡距离校验：计算 GPS 打卡点与任务目标点的平面距离。
 *
 * <p>任务坐标 x/y 是园区本地米制（CGCS2000 投影 easting/northing），
 * 打卡 GPS 是 WGS84 经纬度。用 CoordTransform 将 GPS 投到米制后做欧氏距离。</p>
 *
 * <p>阈值：50 米内合规，50-200 米警告，超 200 米提示过远。
 * 园区单体建筑尺度约 50 米，现场处置要求"到点"。</p>
 */
public final class CheckinDistanceValidator {

    public static final int RANGE_OK = 1;
    public static final int RANGE_WARN = 2;
    public static final int RANGE_FAR = 3;
    public static final int RANGE_UNKNOWN = 0;

    private static final double THRESHOLD_OK_METERS = 50.0;
    private static final double THRESHOLD_FAR_METERS = 200.0;

    private CheckinDistanceValidator() {
    }

    /**
     * 判定打卡点相对任务目标点的距离范围。
     *
     * @param taskX       任务目标点 easting（米制），null 返回 UNKNOWN
     * @param taskY       任务目标点 northing（米制），null 返回 UNKNOWN
     * @param checkinLng  打卡 WGS84 经度
     * @param checkinLat  打卡 WGS84 纬度
     * @return RANGE_OK / RANGE_WARN / RANGE_FAR / RANGE_UNKNOWN
     */
    public static int evaluate(Double taskX, Double taskY, double checkinLng, double checkinLat) {
        if (taskX == null || taskY == null) {
            return RANGE_UNKNOWN;
        }
        double[] projected = CoordTransform.lngLatToProjected(checkinLng, checkinLat);
        double dx = projected[0] - taskX;
        double dy = projected[1] - taskY;
        double distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= THRESHOLD_OK_METERS) {
            return RANGE_OK;
        }
        if (distance <= THRESHOLD_FAR_METERS) {
            return RANGE_WARN;
        }
        return RANGE_FAR;
    }

    /**
     * 计算打卡点与任务目标点的平面距离（米）。
     * taskX/taskY 为 null 时返回 -1。
     */
    public static double distanceMeters(Double taskX, Double taskY,
                                         double checkinLng, double checkinLat) {
        if (taskX == null || taskY == null) {
            return -1;
        }
        double[] projected = CoordTransform.lngLatToProjected(checkinLng, checkinLat);
        double dx = projected[0] - taskX;
        double dy = projected[1] - taskY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static double thresholdOkMeters() {
        return THRESHOLD_OK_METERS;
    }

    public static double thresholdFarMeters() {
        return THRESHOLD_FAR_METERS;
    }
}
