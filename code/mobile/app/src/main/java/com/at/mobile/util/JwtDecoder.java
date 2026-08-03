package com.at.mobile.util;

import android.util.Base64;
import android.util.Log;

import org.json.JSONObject;

/**
 * JWT 解码（仅读 payload，不验签）。
 * 后端 JwtUtils.generateJwt 的 claims = {username, id, role}。
 * 验签需后端 JWT_SECRET，移动端不持有，但 payload 是 base64url 明文，可直接解码拿 claims。
 * 安全性：payload 可被读但不影响安全——验签由后端 TokenInterceptor 完成，移动端只做本地展示用。
 */
public class JwtDecoder {
    private static final String TAG = "JwtDecoder";

    /**
     * 解析 JWT payload，返回 {username, id, role}。
     * @return 解析失败返回 null
     */
    public static Claims decode(String jwt) {
        if (jwt == null || jwt.isEmpty()) return null;
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) return null;
            // payload 是第 2 段，base64url（无 padding）
            byte[] payload = Base64.decode(parts[1], Base64.URL_SAFE | Base64.NO_WRAP);
            String json = new String(payload, "UTF-8");
            JSONObject obj = new JSONObject(json);
            Claims c = new Claims();
            c.username = obj.optString("username", null);
            // id 可能是 int 或 long
            c.id = obj.optLong("id", 0L);
            c.role = obj.optString("role", null);
            return c;
        } catch (Exception e) {
            Log.e(TAG, "JWT 解析失败", e);
            return null;
        }
    }

    public static class Claims {
        public String username;
        public long id;
        public String role;

        public Long getId() {
            return id > 0 ? id : null;
        }
    }
}
