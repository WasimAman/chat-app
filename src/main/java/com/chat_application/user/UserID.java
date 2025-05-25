package com.chat_application.user;

import java.util.UUID;

public class UserID {
    public static String generateChatId() {
        String uuid = UUID.randomUUID().toString();
        String shortId = uuid.replaceAll("-", "").substring(0, 6).toUpperCase();
        return "CHAT-" + shortId;
    }
}
