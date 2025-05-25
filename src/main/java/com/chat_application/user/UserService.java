package com.chat_application.user;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.chat_application.chat.ChatMessage;
import com.chat_application.chat.ChatMessageRepository;
import com.chat_application.chat.ChatNotification;

import java.util.List;

import javax.security.auth.login.CredentialException;

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
        user.setStatus(Status.OFFLINE);
        repository.save(user);
    }

    public void disconnect(String userId) {
        User storedUser = repository.findById(userId).orElse(null);
        if (storedUser != null) {
            storedUser.setStatus(Status.OFFLINE);
            repository.save(storedUser);
        }
    }

    public List<User> findConnectedUsers() {
        return repository.findAllByStatus(Status.ONLINE);
    }

    public User findUserById(String userId) {
        User user = repository.findByUserId(userId);
        if (user != null) {
            return user;
        } else {
            return null;
        }
    }

    public User findUserByEmail(String email) {
        return repository.findByEmail(email);
    }

    public User loginUser(LoginUser loginUser) throws CredentialException {
        User user = repository.findByUserIdOrEmail(loginUser.getUserIdOrEmail())
                .orElseThrow(() -> new RuntimeException("User not found with given userId or email"));
        if (!loginUser.getPassword().equals(user.getPassword())) {
            throw new CredentialException("Invalid Password...");
        }

        user.setStatus(Status.ONLINE);

        List<ChatMessage> unseenMessages = chatMessageRepository.findByRecipientIdAndSeenIsFalse(user.getUserId());

        unseenMessages.stream()
                .map(msg -> new ChatNotification(
                        msg.getId(),
                        msg.getSenderId(),
                        msg.getRecipientId(),
                        msg.getContent()))
                .forEach(notification -> {
                    messagingTemplate.convertAndSendToUser(
                            user.getUserId(),
                            "/queue/messages",
                            notification);
                });
        return repository.save(user);
    }
}
