package com.chat_application.chat;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.chat_application.user.ChatUserDto;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatId(String chatId);

    List<ChatMessage> findByRecipientIdAndSeenIsFalse(String recipientId);

    @Query("SELECT new com.chat_application.user.ChatUserDto(u.nickName, u.fullName, " +
            "SUM(CASE WHEN m.recipientId = :nickname AND m.seen = false THEN 1 ELSE 0 END)) " +
            "FROM ChatMessage m " +
            "JOIN User u ON u.nickName = CASE " +
            "   WHEN m.senderId = :nickname THEN m.recipientId " +
            "   ELSE m.senderId " +
            "END " +
            "WHERE m.senderId = :nickname OR m.recipientId = :nickname " +
            "GROUP BY u.nickName, u.fullName")
    List<ChatUserDto> findChatUsersWithUnseenCount(@Param("nickname") String nickname);

}