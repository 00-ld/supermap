package com.at.mobile.map;

/**
 * 无 Android 依赖的路线引导计算回归测试，可由 JDK 直接运行。
 */
public final class RouteGuidanceTest {

    public static void main(String[] args) {
        RouteGuidance.Summary summary = RouteGuidance.summarize(
                457752.343, 3856245.172,
                457852.343, 3856245.172);

        assertClose(100.0, summary.getDistanceMeters(), 0.01, "东向距离");
        assertEquals("向东", summary.getDirection(), "东向方位");
        assertClose(457802.343, summary.getCenterX(), 0.01, "路线中心 X");
        assertClose(3856245.172, summary.getCenterY(), 0.01, "路线中心 Y");

        RouteGuidance.Summary samePoint = RouteGuidance.summarize(1, 2, 1, 2);
        assertEquals("已到达", samePoint.getDirection(), "到达状态");
    }

    private static void assertClose(double expected, double actual, double tolerance, String label) {
        if (Math.abs(expected - actual) > tolerance) {
            throw new AssertionError(label + "：期望 " + expected + "，实际 " + actual);
        }
    }

    private static void assertEquals(String expected, String actual, String label) {
        if (!expected.equals(actual)) {
            throw new AssertionError(label + "：期望 " + expected + "，实际 " + actual);
        }
    }
}
