package com.posto.dto;

public record LoginResponse(
    String token,
    UserResponse user
) {
}
