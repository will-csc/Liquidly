package com.liquidly.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Request payload for face-image login.
public class FaceLoginRequest {
    @NotBlank(message = "Face image is required")
    @Size(max = 5_000_000, message = "Face image is too large")
    private String faceImage;

    public String getFaceImage() {
        return faceImage;
    }

    public void setFaceImage(String faceImage) {
        this.faceImage = faceImage;
    }
}
