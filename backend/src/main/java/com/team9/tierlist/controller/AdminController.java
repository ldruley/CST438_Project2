// package com.team9.tierlist.controller;

// import java.util.HashMap;
// import java.util.Map;

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.AuthenticationException;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;

// import com.team9.tierlist.model.User;
// import com.team9.tierlist.repository.UserRepository;
// import com.team9.tierlist.service.UserService;
// import com.team9.tierlist.utils.JwtTokenUtil;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;

// @RestController
// @RequestMapping("/admin")
// public class AdminController {
//     private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
//     private final UserService userService;
//     private final PasswordEncoder passwordEncoder;
//     private final AuthenticationManager authenticationManager;
//     private final JwtTokenUtil jwtTokenUtil;
//     private final UserRepository userRepository;

//     public AdminController(UserService userService, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtTokenUtil jwtTokenUtil,UserRepository userRepository) {
//         this.userService = userService;
//         this.passwordEncoder = passwordEncoder;
//         this.authenticationManager = authenticationManager;
//         this.jwtTokenUtil = jwtTokenUtil;
//         this.userRepository = userRepository;
//     }

//     }

// @GetMapping("/setup-admin")
//     public String setupAdmin() {
//         if (!userRepository.existsByIsAdminTrue()) {
//             User admin = new User();
//             admin.setUsername("admin");
//             admin.setEmail("admin@example.com");
            
//             // This will use the exact same encoder your app uses for authentication
//             String encodedPassword = passwordEncoder.encode("admin");
//             admin.setPassword(encodedPassword);
//             admin.setAdmin(true);
            
//             userRepository.save(admin);
            
//             return "Admin created with password 'admin'. Encoded password: " + encodedPassword;
//         }
//         return "Admin already exists";
//     }
    
   
// }