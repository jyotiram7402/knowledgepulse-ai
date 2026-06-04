package com.knowledgepulse.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(AppProperties props) {
        AppProperties.Cloudinary c = props.getCloudinary();
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", c.getCloudName(),
            "api_key", c.getApiKey(),
            "api_secret", c.getApiSecret(),
            "secure", true
        ));
    }
}
