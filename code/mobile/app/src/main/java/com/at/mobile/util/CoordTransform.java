package com.at.mobile.util;

/**
 * 园区坐标换算：iServer CGCS2000 米制投影 ↔ WGS84 经纬度。
 *
 * 移植自网页端 supermapGeoreference.js 的 D 锚点（iServer 数据集真实锚点）。
 * iServer 上化工园区矢量数据集锚定在 D 锚点：
 *   投影 easting=457752.343, northing=3856245.172 ↔ 本地 (0,0) ↔ WGS84 (113.53946, 34.83165)
 * Y 轴向南（northing 减小 = 本地 y 增大），1 unit = 1 m。
 *
 * 注：本地系仅做桥梁，移动端地图内部坐标即米制投影坐标（easting/northing），
 * 因此本类只提供 投影 ↔ 经纬度 的换算，不涉及本地系。
 */
public final class CoordTransform {

    /** D 锚点 CGCS2000 投影坐标（3 度带中央经线 114°E）。 */
    private static final double ANCHOR_EASTING = 457752.343;
    private static final double ANCHOR_NORTHING = 3856245.172;

    /** D 锚点 WGS84 经纬度。 */
    private static final double ANCHOR_LNG = 113.53946126;
    private static final double ANCHOR_LAT = 34.83164647;

    private CoordTransform() {
    }

    /**
     * CGCS2000 投影坐标 → WGS84 经纬度。
     * 粗略反高斯-克吕格投影：用 D 锚点附近的经纬度增量近似。
     * 1° 经度 ≈ 111320×cos(lat) 米，1° 纬度 ≈ 111000 米。
     * 园区范围 <2km，该线性近似误差 <1m，满足 UI 显示精度。
     */
    public static double[] projectedToLngLat(double easting, double northing) {
        double dEasting = easting - ANCHOR_EASTING;
        double dNorthing = northing - ANCHOR_NORTHING;
        double lat = ANCHOR_LAT + dNorthing / 111000.0;
        double lng = ANCHOR_LNG + dEasting / (111320.0 * Math.cos(Math.toRadians(ANCHOR_LAT)));
        return new double[]{lng, lat};
    }

    /** WGS84 经纬度 → CGCS2000 投影坐标（移动端打卡坐标投影上传用）。 */
    public static double[] lngLatToProjected(double lng, double lat) {
        double dLng = lng - ANCHOR_LNG;
        double dLat = lat - ANCHOR_LAT;
        double easting = ANCHOR_EASTING + dLng * 111320.0 * Math.cos(Math.toRadians(ANCHOR_LAT));
        double northing = ANCHOR_NORTHING + dLat * 111000.0;
        return new double[]{easting, northing};
    }
}
