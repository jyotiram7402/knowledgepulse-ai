package com.knowledgepulse.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.knowledgepulse.config.AppProperties;
import com.knowledgepulse.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final AppProperties props;

    public Upload upload(MultipartFile file, UUID ownerId) {
        try {
            String publicId = props.getCloudinary().getFolder() + "/" + ownerId + "/" + UUID.randomUUID();
            Map<String, Object> options = ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", "raw",
                "use_filename", true,
                "unique_filename", false,
                "overwrite", true
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);
            return new Upload(
                String.valueOf(res.get("secure_url")),
                String.valueOf(res.get("public_id"))
            );
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "File upload failed");
        }
    }

    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
        } catch (IOException e) {
            log.warn("Cloudinary delete failed for publicId={}", publicId, e);
        }
    }

    public record Upload(String url, String publicId) {}
}
