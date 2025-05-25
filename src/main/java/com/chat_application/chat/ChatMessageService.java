package com.chat_application.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.chat_application.chatroom.ChatRoomService;
import com.chat_application.user.ChatUserDto;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ChatMessageService {
    @Autowired
    private ChatMessageRepository repository;
    @Autowired
    private ChatRoomService chatRoomService;

    public ChatMessage save(ChatMessage chatMessage) {
        var chatId = chatRoomService
                .getChatRoomId(chatMessage.getSenderId(), chatMessage.getRecipientId(), true)
                .orElseThrow();

        chatMessage.setChatId(chatId);
        chatMessage.setSeen(false); // 👈
        chatMessage.setTimestamp(new Date());

        return repository.save(chatMessage);
    }

    public List<ChatMessage> findChatMessages(String senderId, String recipientId) {
        var chatId = chatRoomService.getChatRoomId(senderId, recipientId, false);
        return chatId.map(repository::findByChatId).orElse(new ArrayList<>());
    }

    public void markMessagesAsSeen(String senderId, String recipientId) {
        var chatId = chatRoomService.getChatRoomId(senderId, recipientId, false);
        chatId.ifPresent(id -> {
            List<ChatMessage> messages = repository.findByChatId(id);
            for (ChatMessage msg : messages) {
                if (msg.getRecipientId().equals(recipientId)) {
                    msg.setSeen(true);
                }
            }
            System.out.println("Hello mrrrrrrr");
            repository.saveAll(messages);
        });
    }

    public List<ChatUserDto> getChatUsersWithUnseenMessages(String userId) {
        return repository.findChatUsersWithUnseenCount(userId);
    }
}
