package com.at.mobile;

import android.app.Application;
import android.content.res.AssetManager;
import android.util.Log;

import com.supermap.data.LicenseStatus;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * 应用入口：负责 SuperMap iMobile 许可初始化。
 *
 * 【超图集成点 1】
 * Environment.setLicensePath + Environment.initialization 是 iMobile 所有 GIS 功能的前置条件，
 * 必须在任何 com.supermap.* API 调用前完成，否则组件不可用。
 *
 * 许可目录选型（2026-07-22 真机验证修复）：
 * 早期版本用 /sdcard/SuperMap/License/，Android 10+ scoped storage 下需要 WRITE_EXTERNAL_STORAGE
 * 运行时权限且可能被限制。改用应用私有外部目录 getExternalFilesDir(null)/SuperMap/License/，
 * 无需任何存储权限即可写，SuperMap 许可照样加载，兼容 Android 10/11/12+。
 *
 * 注意：com.supermap.data.Environment 与 android.os.Environment 简名冲突，com.supermap 的用全限定名调用。
 */
public class App extends Application {
    private static final String TAG = "ChemApp";
    private static App instance;
    private static boolean licenseValid = false;
    private static String licenseDir;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        licenseDir = new File(getExternalFilesDir(null), "SuperMap/License").getAbsolutePath() + "/";
        initLicense();
    }

    public static App get() {
        return instance;
    }

    public static boolean isLicenseValid() {
        return licenseValid;
    }

    public static String getLicenseDir() {
        return licenseDir;
    }

    /** 初始化 SuperMap iMobile 许可：拷贝 assets/License/*.slm → 私有外部目录，再激活。 */
    private void initLicense() {
        try {
            File dir = new File(licenseDir);
            if (!dir.exists() && !dir.mkdirs()) {
                throw new IOException("mkdirs failed: " + licenseDir);
            }
            copyAssetDir("License", licenseDir);
            // initialization 内部会 setTemporaryPath/setWebCacheDirectory 到默认 /sdcard/SuperMap/temp|data/，
            // Android 10+ scoped storage 下 /sdcard 不可写，必须全部预先指向应用私有目录。
            File superRoot = new File(getExternalFilesDir(null), "SuperMap");
            String tempPath = new File(superRoot, "temp").getAbsolutePath() + "/";
            String webCachePath = new File(superRoot, "data").getAbsolutePath() + "/";
            new File(tempPath).mkdirs();
            new File(webCachePath).mkdirs();
            com.supermap.data.Environment.setTemporaryPath(tempPath);
            com.supermap.data.Environment.setWebCacheDirectory(webCachePath);
            com.supermap.data.Environment.setLicensePath(licenseDir);
            com.supermap.data.Environment.initialization(this);
            LicenseStatus status = com.supermap.data.Environment.getLicenseStatus();
            licenseValid = status != null && status.isLicenseValid();
            Log.i(TAG, "SuperMap license valid = " + licenseValid + ", dir=" + licenseDir);
        } catch (Exception e) {
            Log.e(TAG, "SuperMap license init failed", e);
            licenseValid = false;
        }
    }

    /** 递归拷贝 assets 目录到目标路径，每写文件前确保父目录存在。 */
    private void copyAssetDir(String assetPath, String destPath) throws IOException {
        String[] names = getAssets().list(assetPath);
        if (names == null || names.length == 0) {
            copyAssetFile(assetPath, destPath);
            return;
        }
        new File(destPath).mkdirs();
        for (String name : names) {
            copyAssetDir(assetPath + "/" + name, destPath + "/" + name);
        }
    }

    private void copyAssetFile(String assetPath, String destPath) throws IOException {
        File target = new File(destPath);
        File parent = target.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IOException("mkdirs failed: " + parent.getAbsolutePath());
        }
        if (target.exists()) return;
        try (InputStream is = getAssets().open(assetPath);
             FileOutputStream fos = new FileOutputStream(target)) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = is.read(buf)) != -1) {
                fos.write(buf, 0, n);
            }
            fos.flush();
        }
    }
}
