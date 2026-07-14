package com.at.interceptor;

import com.at.exception.GlobalExceptionHandler;
import com.at.filter.RequestIdFilter;
import com.at.pojo.Result;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InterceptorErrorResponseTest {

    @Test
    void missingTokenUsesControllerAdviceAndRequestIdContext() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        mockMvc.perform(get("/api/probe").header(RequestIdFilter.REQUEST_ID_HEADER, "trace-001"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(RequestIdFilter.REQUEST_ID_HEADER, "trace-001"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("未登录"))
                .andExpect(jsonPath("$.ok").value(false))
                .andExpect(jsonPath("$.requestId").value("trace-001"));
    }

    @Test
    void unsafeRequestIdHeaderIsReplacedBeforeResponseSerialization() throws Exception {
        MockMvc mockMvc = buildMockMvc();

        MvcResult result = mockMvc.perform(get("/api/probe").header(RequestIdFilter.REQUEST_ID_HEADER, "bad request id!"))
                .andExpect(status().isUnauthorized())
                .andReturn();

        String requestId = result.getResponse().getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        assertThat(requestId)
                .isNotEqualTo("bad request id!")
                .matches("[0-9a-f-]{36}");
        assertThat(result.getResponse().getContentAsString()).contains("\"requestId\":\"" + requestId + "\"");
    }

    private MockMvc buildMockMvc() {
        return MockMvcBuilders.standaloneSetup(new ProbeController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new RequestIdFilter())
                .addInterceptors(new TokenInterceptor())
                .build();
    }

    @RestController
    static class ProbeController {

        @GetMapping("/api/probe")
        public Result<String> probe() {
            return Result.success("ok");
        }
    }
}
