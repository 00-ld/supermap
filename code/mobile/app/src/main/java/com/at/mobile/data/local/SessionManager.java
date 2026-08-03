package com.at.mobile.data.local;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * 会话与登录态持久化：token / userId / username / role。
 * token 通过 Header "token" 注入（与网页端 request.ts 一致，非 Authorization Bearer）。
 */
public class SessionManager {
    private static final String PREF_NAME = "chem_session";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER_ID = "userId";
    private static final String KEY_USERNAME = "username";
    private static final String KEY_ROLE = "role";

    private static SessionManager instance;
    private final SharedPreferences sp;

    private SessionManager(Context ctx) {
        sp = ctx.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized SessionManager get(Context ctx) {
        if (instance == null) {
            instance = new SessionManager(ctx);
        }
        return instance;
    }

    public void saveLogin(String token, Long userId, String username, String role) {
        SharedPreferences.Editor e = sp.edit();
        e.putString(KEY_TOKEN, token);
        if (userId != null) e.putLong(KEY_USER_ID, userId);
        if (username != null) e.putString(KEY_USERNAME, username);
        if (role != null) e.putString(KEY_ROLE, role);
        e.apply();
    }

    public String getToken() {
        return sp.getString(KEY_TOKEN, null);
    }

    public Long getUserId() {
        if (!sp.contains(KEY_USER_ID)) return null;
        return sp.getLong(KEY_USER_ID, 0L);
    }

    public String getUsername() {
        return sp.getString(KEY_USERNAME, null);
    }

    public String getRole() {
        return sp.getString(KEY_ROLE, null);
    }

    public boolean isLoggedIn() {
        return getToken() != null && !getToken().isEmpty();
    }

    public boolean isAdmin() {
        return "admin".equals(getRole());
    }

    public void clear() {
        SharedPreferences.Editor e = sp.edit();
        e.clear();
        e.apply();
    }
}
