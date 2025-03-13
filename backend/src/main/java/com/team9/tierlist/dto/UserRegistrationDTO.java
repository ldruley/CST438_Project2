// package com.team9.tierlist.dto;

// import javax.validation.constraints.Email;
// import javax.validation.constraints.NotEmpty;
// import javax.validation.constraints.Size;

// public class UserRegistrationDTO {

//     @NotEmpty(message = "Username is required")
//     @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
//     private String username;

//     @NotEmpty(message = "Password is required")
//     @Size(min = 6, message = "Password must be at least 6 characters long")
//     private String password;

//     @NotEmpty(message = "Email is required")
//     @Email(message = "Email should be valid")
//     private String email;

//     // Getters and setters
//     public String getUsername() {
//         return username;
//     }

//     public void setUsername(String username) {
//         this.username = username;
//     }

//     public String getPassword() {
//         return password;
//     }

//     public void setPassword(String password) {
//         this.password = password;
//     }

//     public String getEmail() {
//         return email;
//     }

//     public void setEmail(String email) {
//         this.email = email;
//     }
// }
