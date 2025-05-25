package com.chat_application.user;

import lombok.Data;

@Data
public class LoginUser {
    private String userIdOrEmail;
    private String password;
}
