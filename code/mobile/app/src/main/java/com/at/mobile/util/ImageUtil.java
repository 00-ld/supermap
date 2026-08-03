package com.at.mobile.util;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * 图片工具：从 Uri 读取 bitmap，按质量压缩到目标体积内，返回 byte[] 供 multipart 上传。
 * 目标体积 <2MB，避免超后端 10MB 单文件限制同时省流量。
 */
public class ImageUtil {

    private static final String TAG = "ImageUtil";
    private static final int TARGET_MAX_BYTES = 2 * 1024 * 1024;
    private static final int SAMPLE_SIZE = 2;

    private ImageUtil() {
    }

    /** 从 Uri 读图并压缩，返回 jpeg 字节数组；失败返回 null。 */
    public static byte[] compressFromUri(Context ctx, Uri uri) {
        if (uri == null) {
            return null;
        }
        Bitmap bitmap = decodeSampledBitmap(ctx, uri);
        if (bitmap == null) {
            return null;
        }
        byte[] bytes = compressBitmap(bitmap);
        bitmap.recycle();
        return bytes;
    }

    /** 先采样降低内存（相机原图可能很大），再按质量递减压缩到目标体积。 */
    private static byte[] compressBitmap(Bitmap bitmap) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int quality = 90;
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out);
        while (out.size() > TARGET_MAX_BYTES && quality > 30) {
            quality -= 10;
            out.reset();
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out);
        }
        return out.toByteArray();
    }

    /** 采样解码：先读尺寸再按 SAMPLE_SIZE 缩放，防 OOM。 */
    private static Bitmap decodeSampledBitmap(Context ctx, Uri uri) {
        try (InputStream input = ctx.getContentResolver().openInputStream(uri)) {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inSampleSize = SAMPLE_SIZE;
            return BitmapFactory.decodeStream(input, null, options);
        } catch (IOException e) {
            Log.e(TAG, "读取图片失败", e);
            return null;
        }
    }
}
