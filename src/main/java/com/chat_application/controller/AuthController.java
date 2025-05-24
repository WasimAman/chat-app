// package com.chat_application.controller;

// import java.util.Collections;
// import java.util.Optional;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RestController;

// import com.chat_application.user.UserRepository;



// @RestController
// @RequestMapping("/api/auth")
// public class AuthController {

//     @Autowired
//     private UserRepository userRepository;

//     @Autowired
//     private jwtUtil jwtUtil;

//     @PostMapping("/signup")
//     public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
//         if (userRepository.findByUsername(req.getUsername()).isPresent()) {
//             return ResponseEntity.badRequest().body("Username exists");
//         }

//         User user = new User();
//         user.setUsername(req.getUsername());
//         user.setPassword(req.getPassword());
//         userRepository.save(user);
//         return ResponseEntity.ok("User registered");
//     }

//     @PostMapping("/login")
//     public ResponseEntity<?> login(@RequestBody User user) {
//         Optional<User> found = userRepository.findByUsername(user.getUsername());
//         if (found.isPresent() && found.get().getPassword().equals(user.getPassword())) {
//             String token = jwtUtil.generateToken(user.getUsername());
//             return ResponseEntity.ok(Collections.singletonMap("token", token));
//         }
//         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
//     }
// }

