package com.knowledgepulse.service;

import com.knowledgepulse.dto.UpdateProfileRequest;
import com.knowledgepulse.dto.UserResponse;
import com.knowledgepulse.entity.User;
import com.knowledgepulse.exception.BadRequestException;
import com.knowledgepulse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse me(User user) {
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(User user, UpdateProfileRequest req) {
        if (req.name() != null && !req.name().isBlank()) {
            user.setName(req.name().trim());
        }
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            if (req.currentPassword() == null || !passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
                throw new BadRequestException("Current password is incorrect");
            }
            if (req.newPassword().length() < 8) {
                throw new BadRequestException("New password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(req.newPassword()));
        }
        return UserResponse.from(userRepository.save(user));
    }
}
