package com.at.mobile.data.remote.dto;

import com.google.gson.annotations.SerializedName;

/**
 * 登录请求体，对应后端 User {username, password}。
 */
public class LoginRequest {
    @SerializedName("username")
    private String username;

    @SerializedName("password")
    private String password;

    public LoginRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() { return username; }
    public String getPassword() { return password; }
}
