package com.chat_application.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import javax.security.auth.login.CredentialException;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        try {
            if(userService.findUserByEmail(user.getEmail()) != null){
                throw new UserException("Please try with another email...");
            }
            user.setUserId(UserID.generateChatId());
            userService.saveUser(user);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("User registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public User addUser(@RequestBody LoginUser loginUser ) throws CredentialException {
        User user = userService.loginUser(loginUser);
        return user;
    }

    @MessageMapping("/user.disconnectUser")
    public String  disconnectUser(
            @Payload String userId) {
        userService.disconnect(userId);
        return userId;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> findConnectedUsers() {
        return ResponseEntity.ok(userService.findConnectedUsers());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<User> findUserById(@PathVariable String userId) {
        User user = userService.findUserById(userId);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

}
