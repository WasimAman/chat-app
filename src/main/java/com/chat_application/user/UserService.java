package com.chat_application.user;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.chat_application.chat.ChatMessage;
import com.chat_application.chat.ChatMessageRepository;
import com.chat_application.chat.ChatNotification;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void saveUser(User user) {
        user.setStatus(Status.ONLINE);
        repository.save(user);

        List<ChatMessage> unseenMessages = chatMessageRepository.findByRecipientIdAndSeenIsFalse(user.getNickName());

        unseenMessages.stream()
                .map(msg -> new ChatNotification(
                        msg.getId(),
                        msg.getSenderId(),
                        msg.getRecipientId(),
                        msg.getContent()))
                .forEach(notification -> {
                    messagingTemplate.convertAndSendToUser(
                            user.getNickName(),
                            "/queue/messages",
                            notification);
                });
    }

    public void disconnect(User user) {
        User storedUser = repository.findById(user.getNickName()).orElse(null);
        if (storedUser != null) {
            storedUser.setStatus(Status.OFFLINE);
            repository.save(storedUser);
        }
    }

    public List<User> findConnectedUsers() {
        return repository.findAllByStatus(Status.ONLINE);
    }

    public User findUserById(String nickName) {
        User user = repository.findByNickName(nickName);
        if (user != null) {
            return user;
        } else {
            return null;
        }
    }
}
