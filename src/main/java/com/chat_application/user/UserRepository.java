package com.chat_application.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository  extends JpaRepository<User, String> {
    List<User> findAllByStatus(Status status);
    User findByUserId(String userId);
    User findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.userId = :userIdOrEmail OR u.email = :userIdOrEmail")
    Optional<User> findByUserIdOrEmail(@Param("userIdOrEmail") String userIdOrEmail);
}
