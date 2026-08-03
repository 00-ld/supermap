package com.at.mobile.data.local;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.AssetManager;

import java.io.InputStream;
import java.util.Properties;

/**
 * 运行时配置：从 assets/config.properties 读取后端/iServer 地址、地图范围、超时等。
 * 支持在 App 内动态修改 backend.baseurl（持久化落盘）。
 */
public class AppConfig {
    private static AppConfig instance;
    private final Properties props = new Properties();
    private final Context context;

    private AppConfig(Context ctx) {
        this.context = ctx.getApplicationContext();
        AssetManager am = context.getAssets();
        try (InputStream is = am.open("config.properties")) {
            props.load(is);
        } catch (Exception e) {
            throw new IllegalStateException("读取 config.properties 失败", e);
        }
    }

    public static synchronized AppConfig get(Context ctx) {
        if (instance == null) {
            instance = new AppConfig(ctx.getApplicationContext());
        }
        return instance;
    }

    public String getBackendBaseUrl() {
        SharedPreferences sp = context.getSharedPreferences("chem_app_config", Context.MODE_PRIVATE);
        String override = sp.getString("override_backend_url", null);
        if (override != null && !override.trim().isEmpty()) {
            String url = override.trim();
            if (!url.endsWith("/")) {
                url += "/";
            }
            return url;
        }
        return props.getProperty("backend.baseurl", "http://localhost:8081/");
    }

    public void setBackendBaseUrl(String url) {
        SharedPreferences sp = context.getSharedPreferences("chem_app_config", Context.MODE_PRIVATE);
        sp.edit().putString("override_backend_url", url).apply();
    }

    public void clearBackendBaseUrlOverride() {
        SharedPreferences sp = context.getSharedPreferences("chem_app_config", Context.MODE_PRIVATE);
        sp.edit().remove("override_backend_url").apply();
    }

    public String getIServerBaseUrl() {
        return props.getProperty("iserver.baseurl", "https://www.chemgas.lab6119.xyz/iserver");
    }

    public String getMapUrl() {
        return props.getProperty("iserver.map.url");
    }

    public String getDataUrl() {
        return props.getProperty("iserver.data.url");
    }

    public String getSceneUrl() {
        return props.getProperty("iserver.scene.url");
    }

    public String getSceneName() {
        return props.getProperty("iserver.scene.name", "默认场景");
    }

    /** 中国底图 WMTS 服务地址 */
    public String getBasemapUrl() {
        return props.getProperty("iserver.basemap.url", "http://8.130.175.232:18090/iserver/services/map-china/wmts-china");
    }

    /** 中国底图图层名（ChinaLight / ChinaDark / China / China_4326） */
    public String getBasemapLayer() {
        return props.getProperty("iserver.basemap.layer", "ChinaLight");
    }

    public int getMapEpsg() {
        return Integer.parseInt(props.getProperty("map.epsg", "-1000"));
    }

    public double getMapLeft() { return Double.parseDouble(props.getProperty("map.bounds.left", "0")); }
    public double getMapBottom() { return Double.parseDouble(props.getProperty("map.bounds.bottom", "0")); }
    public double getMapRight() { return Double.parseDouble(props.getProperty("map.bounds.right", "0")); }
    public double getMapTop() { return Double.parseDouble(props.getProperty("map.bounds.top", "0")); }
    public double getMapCenterX() { return Double.parseDouble(props.getProperty("map.center.x", "0")); }
    public double getMapCenterY() { return Double.parseDouble(props.getProperty("map.center.y", "0")); }

    public int getConnectTimeout() {
        return Integer.parseInt(props.getProperty("http.connect.timeout", "15000"));
    }

    public int getReadTimeout() {
        return Integer.parseInt(props.getProperty("http.read.timeout", "30000"));
    }

    public boolean isDebugLog() {
        return Boolean.parseBoolean(props.getProperty("debug.log", "true"));
    }
}
