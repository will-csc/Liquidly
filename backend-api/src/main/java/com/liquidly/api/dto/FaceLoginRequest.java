package com.liquidly.api.dto;

// Request payload for face-image login.
public class FaceLoginRequest {
    private String faceImage;

    public String getFaceImage() {
        return faceImage;
    }

    public void setFaceImage(String faceImage) {
        this.faceImage = faceImage;
    }
}
