package com.backend.be_realestate.modals.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDto {
    private String url;
    private String name;
    private String mimeType;
    private Long sizeBytes;
    private String publicId;      // r.getPublicId()
    private String resourceType;  // "image", "video", "raw" ..
}