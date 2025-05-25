package com.chat_application.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import com.chat_application.user.ChatUserDto;

import java.util.List;

@Controller
public class ChatController {
        @Autowired
        private SimpMessagingTemplate messagingTemplate;
        @Autowired
        private ChatMessageService chatMessageService;

        @MessageMapping("/chat")
        public void processMessage(@Payload ChatMessage chatMessage) {
                ChatMessage savedMsg = chatMessageService.save(chatMessage);
                messagingTemplate.convertAndSendToUser(
                                chatMessage.getRecipientId(), "/queue/messages",
                                new ChatNotification(
                                                savedMsg.getId(),
                                                savedMsg.getSenderId(),
                                                savedMsg.getRecipientId(),
                                                savedMsg.getContent()));
        }

        @GetMapping("/messages/{senderId}/{recipientId}")
        public ResponseEntity<List<ChatMessage>> findChatMessages(@PathVariable String senderId,
                        @PathVariable String recipientId) {
                return ResponseEntity
                                .ok(chatMessageService.findChatMessages(senderId, recipientId));
        }

        @PutMapping("/messages/seen/{senderId}/{recipientId}")
        public ResponseEntity<Void> markMessagesAsSeen(@PathVariable String senderId,
                        @PathVariable String recipientId) {
                chatMessageService.markMessagesAsSeen(senderId, recipientId);
                return ResponseEntity.ok().build();
        }

        @GetMapping("/chat-users/{userId}")
        public ResponseEntity<List<ChatUserDto>> getChatUsers(@PathVariable String userId) {
                List<ChatUserDto> users = chatMessageService.getChatUsersWithUnseenMessages(userId);
                return ResponseEntity.ok(users);
        }
}