package com.knowledgepulse.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME = "bearer-jwt";

    @Bean
    public OpenAPI knowledgePulseOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("KnowledgePulse AI API")
                .description("Enterprise RAG knowledge assistant API")
                .version("1.0.0")
                .license(new License().name("MIT")))
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME))
            .components(new Components().addSecuritySchemes(SECURITY_SCHEME,
                new SecurityScheme()
                    .name(SECURITY_SCHEME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
