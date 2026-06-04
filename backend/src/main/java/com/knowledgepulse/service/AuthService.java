package com.knowledgepulse.service;

import com.knowledgepulse.config.AppProperties;
import com.knowledgepulse.dto.AuthResponse;
import com.knowledgepulse.dto.LoginRequest;
import com.knowledgepulse.dto.RegisterRequest;
import com.knowledgepulse.dto.UserResponse;
import com.knowledgepulse.entity.Role;
import com.knowledgepulse.entity.User;
import com.knowledgepulse.exception.ConflictException;
import com.knowledgepulse.exception.UnauthorizedException;
import com.knowledgepulse.repository.RoleRepository;
import com.knowledgepulse.repository.UserRepository;
import com.knowledgepulse.security.JwtService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AppProperties props;

    @PostConstruct
    @Transactional
    public void bootstrap() {
        for (Role.Name n : Role.Name.values()) {
            roleRepository.findByName(n).orElseGet(() -> roleRepository.save(Role.builder().name(n).build()));
        }
        String adminEmail = props.getAdmin().getEmail();
        String adminPwd = props.getAdmin().getPassword();
        if (adminEmail == null || adminPwd == null || adminEmail.isBlank() || adminPwd.isBlank()) return;
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) return;

        Role admin = roleRepository.findByName(Role.Name.ROLE_ADMIN).orElseThrow();
        Role user = roleRepository.findByName(Role.Name.ROLE_USER).orElseThrow();
        Set<Role> roles = new HashSet<>();
        roles.add(admin);
        roles.add(user);

        User u = User.builder()
            .name("Administrator")
            .email(adminEmail.toLowerCase())
            .password(passwordEncoder.encode(adminPwd))
            .enabled(true)
            .roles(roles)
            .build();
        userRepository.save(u);
        log.info("Bootstrapped admin user {}", adminEmail);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email already registered");
        }
        Role userRole = roleRepository.findByName(Role.Name.ROLE_USER)
            .orElseThrow(() -> new IllegalStateException("ROLE_USER missing"));
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
            .name(req.name().trim())
            .email(email)
            .password(passwordEncoder.encode(req.password()))
            .enabled(true)
            .roles(roles)
            .build();
        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return new AuthResponse(token, UserResponse.from(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (AuthenticationException e) {
            throw new UnauthorizedException("Invalid email or password");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserResponse.from(user));
    }
}
