package com.chat_application.user;

public class ChatUserDto {
    private String nickName;
    private String fullName;
    private long unseenMessages;

    public ChatUserDto(String nickName, String fullName, long unseenMessages) {
        this.nickName = nickName;
        this.fullName = fullName;
        this.unseenMessages = unseenMessages;
    }

    // Getters
    public String getNickName() {
        return nickName;
    }

    public String getFullName() {
        return fullName;
    }

    public long getUnseenMessages() {
        return unseenMessages;
    }

    // Setters
    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setUnseenMessages(long unseenMessages) {
        this.unseenMessages = unseenMessages;
    }
}
