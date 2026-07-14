package com.at.context;

import org.slf4j.MDC;

import java.util.UUID;

public final class RequestContext {

    public static final String REQUEST_ID_KEY = "requestId";

    private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

    private RequestContext() {
    }

    public static void setRequestId(String requestId) {
        REQUEST_ID.set(requestId);
        MDC.put(REQUEST_ID_KEY, requestId);
    }

    public static String currentRequestId() {
        return REQUEST_ID.get();
    }

    public static String requestIdForResponse() {
        String requestId = currentRequestId();
        if (requestId == null || requestId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return requestId;
    }

    public static void clear() {
        REQUEST_ID.remove();
        MDC.remove(REQUEST_ID_KEY);
    }
}
