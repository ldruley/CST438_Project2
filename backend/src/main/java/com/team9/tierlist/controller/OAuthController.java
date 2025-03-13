
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;

// import com.team9.tierlist.dto.AuthResponse;
// import com.team9.tierlist.model.User;
// import com.team9.tierlist.service.UserService;

// @RestController
// @RequestMapping("/api/oauth2")
// public class OAuthController {

//     @Autowired
//     private UserService userService;

//     // This method will handle both login or creating a new user
//     @PostMapping("/login-or-create")
//     public ResponseEntity<?> loginOrCreate(@RequestBody OAuthRequest oAuthRequest) {
//         String idToken = oAuthRequest.getToken(); // Get the token from frontend

//         // Step 1: Validate the Google ID Token
//         if (userService.verifyGoogleIdToken(idToken)) {
//             GoogleIdToken token = userService.getGoogleIdToken(idToken);
//             String email = token.getPayload().getEmail();  // Extract email from token payload

//             // Step 2: Check if the user already exists based on email
//             User user = userService.findByEmail(email);

//             if (user == null) {
//                 // Step 3: If user doesn't exist, create a new user
//                 // Here you can use the email prefix as a default username or prompt for more info
//                 user = new User();
//                 user.setEmail(email);
//                 user.setUsername(email.split("@")[0]); // Use email prefix as default username
//                 userService.saveUser(user); // Save the new user to the database

//                 // Generate JWT token for the newly created user
//                 String jwtToken = userService.generateJwtToken(user);
//                 return ResponseEntity.ok(new AuthResponse(jwtToken)); // Respond with JWT token
//             }

//             // Step 4: If the user exists, generate JWT token
//             String jwtToken = userService.generateJwtToken(user);
//             return ResponseEntity.ok(new AuthResponse(jwtToken)); // Respond with JWT token
//         } else {
//             // If token is invalid, return an unauthorized response
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google ID token");
//         }
//     }
// }
