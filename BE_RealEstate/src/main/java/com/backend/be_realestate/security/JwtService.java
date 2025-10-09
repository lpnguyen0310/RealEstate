package com.backend.be_realestate.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service

public class JwtService {
    private final Key key;
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-exp-ms}") long accessExpMs,
            @Value("${app.jwt.refresh-exp-ms}") long refreshExpMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    public String generateAccess(String subject, Map<String, Object> claims){
        return buildToken(subject, claims, accessExpMs);
    }
    public String generateRefresh(String subject){
        return buildToken(subject, Map.of("typ","refresh"), refreshExpMs);
    }

    private String buildToken(String sub, Map<String,Object> claims, long expMs){
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(sub)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isValid(String token){
        try { parse(token); return true; } catch (JwtException | IllegalArgumentException e){ return false; }
    }

    public Jws<Claims> parse(String token){
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }

    public String getSubject(String token){ return parse(token).getBody().getSubject(); }
    public boolean isRefresh(String token){
        Object t = parse(token).getBody().get("typ");
        return "refresh".equals(t);
    }
}
