package com.at.mobile.device;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * 相机助手：用 ACTION_IMAGE_CAPTURE 调系统相机拍照，照片落缓存目录返回 Uri。
 * 不自研 Camera2，系统相机最稳且权限简单（只需 CAMERA 权限）。
 */
public class CameraHelper {

    private static final String TAG = "CameraHelper";
    private static final String PHOTO_DIR = "checkin_photos";

    private Uri photoUri;

    /** 启动系统相机，返回是否成功发起。结果在 onActivityResult 用 EXTRA_PHOTO_URI 取。 */
    public boolean dispatch(Activity activity, int requestCode) {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(activity.getPackageManager()) == null) {
            Log.w(TAG, "无可用相机应用");
            return false;
        }

        File photoFile = createImageFile(activity);
        if (photoFile == null) {
            return false;
        }
        photoUri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", photoFile);
        intent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
        activity.startActivityForResult(intent, requestCode);
        return true;
    }

    public Uri getPhotoUri() {
        return photoUri;
    }

    private File createImageFile(Activity activity) {
        File dir = new File(activity.getCacheDir(), PHOTO_DIR);
        if (!dir.exists() && !dir.mkdirs()) {
            Log.e(TAG, "创建照片目录失败");
            return null;
        }
        String name = "checkin_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.CHINA).format(new Date()) + ".jpg";
        File file = new File(dir, name);
        try {
            if (!file.createNewFile()) {
                Log.e(TAG, "创建照片文件失败");
                return null;
            }
        } catch (IOException e) {
            Log.e(TAG, "创建照片文件 IO 异常", e);
            return null;
        }
        return file;
    }
}
