package com.chat_application.chat;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.chat_application.user.ChatUserDto;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatId(String chatId);

    List<ChatMessage> findByRecipientIdAndSeenIsFalse(String recipientId);

    @Query("SELECT new com.chat_application.user.ChatUserDto(u.userId, u.fullName, " +
            "SUM(CASE WHEN m.recipientId = :userId AND m.seen = false THEN 1 ELSE 0 END)) " +
            "FROM ChatMessage m " +
            "JOIN User u ON u.userId = CASE " +
            "   WHEN m.senderId = :userId THEN m.recipientId " +
            "   ELSE m.senderId " +
            "END " +
            "WHERE m.senderId = :userId OR m.recipientId = :userId " +
            "GROUP BY u.userId, u.fullName " +
            "ORDER BY COUNT(m.timestamp) DESC")
    List<ChatUserDto> findChatUsersWithUnseenCount(@Param("userId") String userId);

}