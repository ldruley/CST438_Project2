package com.team9.tierlist.filters;

import com.team9.tierlist.utils.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;

@WebFilter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    public final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtTokenUtil jwtTokenUtil, UserDetailsService userDetailsService) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String path = request.getServletPath();

        // Add debug logging for all requests
        logger.debug("Request path: {}, Method: {}", path, request.getMethod());

        // Skip filter for auth endpoints
        if (path.startsWith("/auth/login") || path.startsWith("/auth/register") ||
                path.startsWith("/auth/logout") || path.startsWith("/auth/debug-complete")) {
            logger.debug("Skipping JWT filter for auth endpoint: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String authorizationHeader = request.getHeader("Authorization");
            logger.debug("Authorization header: {}", authorizationHeader != null ?
                    (authorizationHeader.length() > 10 ? authorizationHeader.substring(0, 10) + "..." : authorizationHeader) : "null");

            if(authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                logger.debug("No Bearer token found, continuing filter chain");
                filterChain.doFilter(request, response);
                return;
            }

            String jwtToken = authorizationHeader.substring(7);
            String username = jwtTokenUtil.extractUsername(jwtToken);
            logger.debug("Extracted username from token: {}", username);

            if(username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                logger.debug("Loaded UserDetails for: {}, authorities: {}", username, userDetails.getAuthorities());

                if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                    logger.debug("Successfully authenticated user: {}, authorities: {}",
                            username, userDetails.getAuthorities());
                } else {
                    logger.debug("Token validation failed for user: {}", username);
                }
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            logger.error("JWT Authentication error: {}", e.getMessage());
            // Continue the filter chain even if authentication fails to avoid blocking the response
            filterChain.doFilter(request, response);
        }
    }
}