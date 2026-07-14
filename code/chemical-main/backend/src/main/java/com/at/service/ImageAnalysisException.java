package com.at.service;

public class ImageAnalysisException extends RuntimeException {

    private final int code;

    public ImageAnalysisException(int code, String message) {
        super(message);
        this.code = code;
    }

    public ImageAnalysisException(int code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
