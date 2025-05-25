package com.chat_application.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatUserDto {
    private String userId;
    private String fullName;
    private long unseenMessages;
}
