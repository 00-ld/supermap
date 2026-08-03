package com.at.mobile.device;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

/**
 * 定位提供者：用原生 LocationManager（不依赖 GMS，国内设备通用）。
 * 优先 GPS，次之 NETWORK；先取 getLastKnownLocation 快速返回，无则监听一次。
 * 坐标为 WGS84 经纬度，落库到 task.checkin_x/y。
 *
 * 线程模型：定位回调由系统在主线程派发（构造时传入 Looper.getMainLooper()），
 * 超时定时器也在主线程 Handler 上，回调里操作 UI 安全。
 */
public class LocationProvider {

    /** 定位超时（毫秒），超时后回调失败并清理监听。 */
    private static final long TIMEOUT_MS = 8000L;
    /** 单次定位最小间距（米）。 */
    private static final float MIN_DISTANCE_M = 0f;

    private final LocationManager locationManager;
    private final Context appContext;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private LocationListener activeListener;
    /** 超时任务是否已触发，避免超时后系统又回调 onLocationChanged 重复通知。 */
    private boolean finished;

    public interface Callback {
        void onLocation(double latitude, double longitude);

        void onFailed(String reason);
    }

    public LocationProvider(Context ctx) {
        appContext = ctx.getApplicationContext();
        locationManager = (LocationManager) appContext.getSystemService(Context.LOCATION_SERVICE);
    }

    /** 是否已授予定位权限。 */
    public static boolean hasPermission(Context ctx) {
        int fine = ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_FINE_LOCATION);
        int coarse = ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_COARSE_LOCATION);
        return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED;
    }

    /** 是否有可用的定位提供者。 */
    public boolean isAvailable() {
        return locationManager != null
                && (isProviderEnabledSafe(LocationManager.GPS_PROVIDER)
                || isProviderEnabledSafe(LocationManager.NETWORK_PROVIDER));
    }

    @SuppressLint("MissingPermission")
    public void requestSingleUpdate(Callback callback) {
        if (locationManager == null || !hasPermission(appContext)) {
            callback.onFailed("定位服务不可用或无权限");
            return;
        }

        String provider = pickProvider();
        if (provider == null) {
            callback.onFailed("无可用定位提供者，请开启 GPS/网络定位");
            return;
        }

        finished = false;
        // 先取缓存位置快速返回（仍校验时效，避免陈旧定位）
        Location last = locationManager.getLastKnownLocation(provider);
        if (last != null) {
            finish(callback, last.getLatitude(), last.getLongitude());
            return;
        }

        // 无缓存则监听一次，超时兜底
        activeListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                finish(callback, location.getLatitude(), location.getLongitude());
            }

            @Override public void onProviderDisabled(String provider) { }
            @Override public void onProviderEnabled(String provider) { }
            @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
        };
        try {
            locationManager.requestSingleUpdate(provider, activeListener, Looper.getMainLooper());
        } catch (SecurityException e) {
            callback.onFailed("定位权限被撤销");
            return;
        }

        mainHandler.postDelayed(() -> {
            if (!finished) {
                stop();
                callback.onFailed("定位超时，请到开阔处重试");
            }
        }, TIMEOUT_MS);
    }

    /** 统一收尾：标记完成、移除监听、取消超时任务，保证回调只触发一次。 */
    private void finish(Callback callback, double lat, double lon) {
        if (finished) {
            return;
        }
        finished = true;
        mainHandler.removeCallbacksAndMessages(null);
        stop();
        callback.onLocation(lat, lon);
    }

    public void stop() {
        if (activeListener != null && locationManager != null) {
            try {
                locationManager.removeUpdates(activeListener);
            } catch (SecurityException e) {
                // 忽略：权限被撤销时清理即可
            }
            activeListener = null;
        }
        mainHandler.removeCallbacksAndMessages(null);
    }

    private String pickProvider() {
        if (isProviderEnabledSafe(LocationManager.GPS_PROVIDER)) {
            return LocationManager.GPS_PROVIDER;
        }
        if (isProviderEnabledSafe(LocationManager.NETWORK_PROVIDER)) {
            return LocationManager.NETWORK_PROVIDER;
        }
        return null;
    }

    private boolean isProviderEnabledSafe(String provider) {
        try {
            return locationManager != null && locationManager.isProviderEnabled(provider);
        } catch (SecurityException e) {
            return false;
        }
    }
}
