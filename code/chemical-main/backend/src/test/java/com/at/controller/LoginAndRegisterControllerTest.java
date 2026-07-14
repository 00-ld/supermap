package com.at.controller;

import com.at.pojo.User;
import com.at.pojo.dto.AuthRequestDTO;
import com.at.service.LoginService;
import com.at.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAndRegisterControllerTest {

    @Mock
    private LoginService loginService;

    @Mock
    private RateLimiterService rateLimiterService;

    private LoginAndRegisterController controller;

    @BeforeEach
    void setUp() {
        controller = new LoginAndRegisterController();
        ReflectionTestUtils.setField(controller, "loginService", loginService);
        ReflectionTestUtils.setField(controller, "rateLimiterService", rateLimiterService);
    }

    @Test
    void loginRateLimitUsesXRealIpFromTrustedProxy() {
        MockHttpServletRequest request = loginRequest("172.18.0.2");
        request.addHeader("X-Real-IP", "203.0.113.10");
        request.addHeader("X-Forwarded-For", "198.51.100.10, 172.18.0.2");

        controller.login(loginUser(), request);

        assertRateLimiterKey("203.0.113.10");
    }

    @Test
    void loginRateLimitFallsBackToXForwardedForFromTrustedProxy() {
        MockHttpServletRequest request = loginRequest("172.18.0.2");
        request.addHeader("X-Forwarded-For", "203.0.113.21, 172.18.0.2");

        controller.login(loginUser(), request);

        assertRateLimiterKey("203.0.113.21");
    }

    @Test
    void loginRateLimitIgnoresXForwardedForFromUntrustedDirectPeer() {
        MockHttpServletRequest request = loginRequest("198.51.100.20");
        request.addHeader("X-Forwarded-For", "203.0.113.21, 172.18.0.2");

        controller.login(loginUser(), request);

        assertRateLimiterKey("198.51.100.20");
    }

    @Test
    void loginMapsAuthDtoToUserWithoutClientControlledFields() {
        MockHttpServletRequest request = loginRequest("127.0.0.1");
        when(loginService.login(any(User.class))).thenReturn("jwt-token");

        controller.login(loginUser(), request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(loginService).login(userCaptor.capture());
        assertThat(userCaptor.getValue().getUsername()).isEqualTo("alice");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("correct-password");
        assertThat(userCaptor.getValue().getRole()).isNull();
        assertThat(userCaptor.getValue().getId()).isNull();
    }

    private MockHttpServletRequest loginRequest(String remoteAddr) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr(remoteAddr);
        return request;
    }

    private AuthRequestDTO loginUser() {
        AuthRequestDTO dto = new AuthRequestDTO();
        dto.setUsername(" alice ");
        dto.setPassword("correct-password");
        return dto;
    }

    private void assertRateLimiterKey(String expectedKey) {
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(rateLimiterService).isRateLimited(
                eq("login"),
                keyCaptor.capture(),
                eq(10),
                eq(Duration.ofMinutes(1))
        );
        assertThat(keyCaptor.getValue()).isEqualTo(expectedKey);
    }
}
