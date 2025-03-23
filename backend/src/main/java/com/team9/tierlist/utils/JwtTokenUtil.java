package com.team9.tierlist.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.Collections;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    @Value("${jwt.secret:}")
    private String secretKeyString;
    
    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;
    
    private SecretKey key;
    
    
    private final Set<String> tokenBlacklist = Collections.synchronizedSet(new HashSet<>());
    
    @PostConstruct
    public void init() {
       
        if (secretKeyString == null || secretKeyString.isEmpty()) {
            key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            System.out.println("Generated a secure random key for JWT signing");
        } else {
          
            key = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
            System.out.println("Using JWT key from application.properties, length: " + secretKeyString.length());
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    // Check if a token is blacklisted
    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklist.contains(token);
    }
    
    // Invalidate a token by adding it to the blacklist
    public void invalidateToken(String token) {
        if (token != null) {
            tokenBlacklist.add(token);
            System.out.println("Token added to blacklist");
        }
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername());
    }

    public String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key)
                .compact();
    }

    // Validate token including blacklist check
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) 
                && !isTokenExpired(token)
                && !isTokenBlacklisted(token));
    }
    
    @Scheduled(fixedRate = 86400000)
    public void cleanupBlacklist() {
        Date now = new Date();
        Set<String> tokensToRemove = new HashSet<>();
        
        // Find all expired tokens in the blacklist
        for (String token : tokenBlacklist) {
            try {
                Date expiration = extractExpiration(token);
                if (expiration.before(now)) {
                    tokensToRemove.add(token);
                }
            } catch (Exception e) {
                
                tokensToRemove.add(token);
            }
        }
        
        // Remove expired tokens from the blacklist
        if (!tokensToRemove.isEmpty()) {
            tokenBlacklist.removeAll(tokensToRemove);
            System.out.println("Cleaned up " + tokensToRemove.size() + " expired tokens from blacklist");
        }
    }
}