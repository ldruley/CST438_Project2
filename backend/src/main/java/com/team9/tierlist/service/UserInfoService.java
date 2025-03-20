package com.team9.tierlist.service;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.team9.tierlist.filters.JwtAuthFilter;

@Service 
public class UserInfoService implements UserDetailsService {
    private final UserRepository userRepository;
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);


    public UserInfoService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.info("UserInfoService: Loading user: " + username);
        User user = userRepository.findByUsername(username);

        if(user == null) {
            logger.error("UserInfoService: Username not found: " + username);
            throw new UsernameNotFoundException("Username not found");
        }

        logger.info("UserInfoService: User found: " + user.getUsername());
         UserDetails userDetails = org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
            .password(user.getPassword())
            .authorities(Collections.singletonList(new SimpleGrantedAuthority(user.isAdmin() ? "ROLE_ADMIN" : "ROLE_USER")))
            .build();
    
    logger.info("UserInfoService: Created UserDetails with authorities: {}", userDetails.getAuthorities());
    
    return userDetails;
    }
}
