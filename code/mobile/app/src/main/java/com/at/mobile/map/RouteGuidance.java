package com.at.mobile.map;

/**
 * 园区米制坐标下的导航摘要计算。
 *
 * <p>路线的实际绘制由 {@link SuperMapHelper} 负责；本类不依赖 Android 或 iMobile，
 * 便于稳定计算距离、方向及推荐地图视点。</p>
 */
public final class RouteGuidance {

    private static final double ARRIVED_DISTANCE_METERS = 8.0;

    private RouteGuidance() {
    }

    public static Summary summarize(double startX, double startY, double destinationX, double destinationY) {
        double deltaX = destinationX - startX;
        double deltaY = destinationY - startY;
        double distanceMeters = Math.hypot(deltaX, deltaY);
        String direction = distanceMeters <= ARRIVED_DISTANCE_METERS
                ? "已到达" : directionFor(Math.toDegrees(Math.atan2(deltaX, deltaY)));
        return new Summary(distanceMeters, direction,
                (startX + destinationX) / 2.0,
                (startY + destinationY) / 2.0);
    }

    private static String directionFor(double bearingDegrees) {
        double normalized = (bearingDegrees + 360.0) % 360.0;
        if (normalized >= 337.5 || normalized < 22.5) return "向北";
        if (normalized < 67.5) return "向东北";
        if (normalized < 112.5) return "向东";
        if (normalized < 157.5) return "向东南";
        if (normalized < 202.5) return "向南";
        if (normalized < 247.5) return "向西南";
        if (normalized < 292.5) return "向西";
        return "向西北";
    }

    public static final class Summary {
        private final double distanceMeters;
        private final String direction;
        private final double centerX;
        private final double centerY;

        private Summary(double distanceMeters, String direction, double centerX, double centerY) {
            this.distanceMeters = distanceMeters;
            this.direction = direction;
            this.centerX = centerX;
            this.centerY = centerY;
        }

        public double getDistanceMeters() { return distanceMeters; }
        public String getDirection() { return direction; }
        public double getCenterX() { return centerX; }
        public double getCenterY() { return centerY; }
    }
}
