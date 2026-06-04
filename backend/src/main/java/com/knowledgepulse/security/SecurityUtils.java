package com.knowledgepulse.security;

import com.knowledgepulse.entity.User;
import com.knowledgepulse.exception.UnauthorizedException;
import com.knowledgepulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails details)) {
            throw new UnauthorizedException("Not authenticated");
        }
        return userRepository.findById(details.getId())
            .orElseThrow(() -> new UnauthorizedException("Current user no longer exists"));
    }
}
