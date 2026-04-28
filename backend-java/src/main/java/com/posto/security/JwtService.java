package com.posto.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.posto.entity.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

  private final SecretKey secretKey;
  private final long expirationMs;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-ms}") long expirationMs) {
    this.secretKey = Keys.hmacShaKeyFor(sha256(secret));
    this.expirationMs = expirationMs;
  }

  public String generateToken(Integer userId, Role role) {
    Date now = new Date();
    Date expiresAt = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim("userId", userId)
        .claim("role", role.getValue())
        .issuedAt(now)
        .expiration(expiresAt)
        .signWith(secretKey)
        .compact();
  }

  public AuthenticatedUser parseToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(secretKey)
        .build()
        .parseSignedClaims(token)
        .getPayload();

    Integer userId = claims.get("userId", Integer.class);
    String role = claims.get("role", String.class);

    if (userId == null) {
      userId = Integer.valueOf(claims.getSubject());
    }

    return new AuthenticatedUser(userId, Role.fromValue(role));
  }

  private byte[] sha256(String value) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 indisponivel.", exception);
    }
  }
}
