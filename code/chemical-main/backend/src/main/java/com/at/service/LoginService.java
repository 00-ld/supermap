

package com.at.service;

import com.at.pojo.User;

public interface LoginService {
    // 登录：返回JWT令牌
    String login(User user);
    // 注册：返回是否成功
    boolean register(User user);
}
