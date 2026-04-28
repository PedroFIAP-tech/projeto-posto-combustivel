package com.posto.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.posto.entity.Role;
import com.posto.exception.ApiException;

@Component
public class SecuritySupport {

  public AuthenticatedUser currentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado.");
    }

    return user;
  }

  public void requireRole(Role role) {
    AuthenticatedUser user = currentUser();

    if (user.role() != role) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Acesso negado. Voce nao tem permissao para realizar esta acao.");
    }
  }

  public boolean isOperational(AuthenticatedUser user) {
    return user.role() == Role.ADMIN || user.role() == Role.FRENTISTA;
  }
}
