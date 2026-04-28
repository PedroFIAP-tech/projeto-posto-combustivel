package com.posto.security;

import com.posto.entity.Role;

public record AuthenticatedUser(
    Integer id,
    Role role
) {
}
