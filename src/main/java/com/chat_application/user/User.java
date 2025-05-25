package com.chat_application.user;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

@Getter
@Setter
@Entity
public class User {
    @Id
    private String userId;
    private String fullName;
    private String email;
    private String password;

    @Enumerated(EnumType.STRING)
    private Status status;
}
