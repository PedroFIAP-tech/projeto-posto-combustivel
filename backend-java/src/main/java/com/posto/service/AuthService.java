package com.posto.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.posto.dto.LoginResponse;
import com.posto.dto.UserResponse;
import com.posto.exception.ApiException;
import com.posto.repository.UserRepository;
import com.posto.security.JwtService;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public LoginResponse login(String email, String rawPassword) {
    String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
    String password = rawPassword == null ? "" : rawPassword.trim();

    if (normalizedEmail.isBlank() || password.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Email e senha sao obrigatorios.");
    }

    var user = userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas."));

    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas.");
    }

    String token = jwtService.generateToken(user.getId(), user.getRole());
    return new LoginResponse(token, UserResponse.from(user));
  }
}
