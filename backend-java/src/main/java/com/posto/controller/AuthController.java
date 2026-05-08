package com.posto.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.posto.dto.UserResponse;
import com.posto.dto.LoginRequest;
import com.posto.dto.LoginResponse;
import com.posto.exception.ApiException;
import com.posto.repository.UserRepository;
import com.posto.security.SecuritySupport;
import com.posto.service.AuthService;

import jakarta.validation.Valid;

@RestController
public class AuthController {

  private final AuthService authService;
  private final SecuritySupport securitySupport;
  private final UserRepository userRepository;

  public AuthController(
      AuthService authService,
      SecuritySupport securitySupport,
      UserRepository userRepository) {
    this.authService = authService;
    this.securitySupport = securitySupport;
    this.userRepository = userRepository;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request.email(), request.password());
  }

  @GetMapping("/me")
  public UserResponse me() {
    var authenticatedUser = securitySupport.currentUser();
    var user = userRepository.findById(authenticatedUser.id())
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessao invalida."));

    return UserResponse.from(user);
  }
}
