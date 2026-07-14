package com.at.interceptor;

import com.at.controller.ImageAnalysisController;
import com.at.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminAuthInterceptorTest {

    private final AdminAuthInterceptor interceptor = new AdminAuthInterceptor();

    @Test
    void normalUserCannotCallPersonAnalysisEndpoint() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/analysis/person");
        request.setAttribute("role", "user");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> interceptor.preHandle(request, response, analysisPersonHandler()))
                .isInstanceOf(ApiException.class)
                .satisfies(exception -> {
                    ApiException apiException = (ApiException) exception;
                    assertThat(apiException.getHttpStatus()).isEqualTo(403);
                    assertThat(apiException.getCode()).isEqualTo(403);
                    assertThat(apiException.getMessage()).isEqualTo("无权限");
                });
        assertThat(response.getContentAsString(StandardCharsets.UTF_8)).isEmpty();
    }

    @Test
    void adminCanCallPersonAnalysisEndpoint() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/analysis/person");
        request.setAttribute("role", "admin");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = interceptor.preHandle(request, response, analysisPersonHandler());

        assertThat(allowed).isTrue();
        assertThat(response.getContentAsString()).isEmpty();
    }

    private HandlerMethod analysisPersonHandler() throws NoSuchMethodException {
        Method method = ImageAnalysisController.class.getMethod("analyzePerson", MultipartFile.class);
        return new HandlerMethod(new ImageAnalysisController(), method);
    }
}
