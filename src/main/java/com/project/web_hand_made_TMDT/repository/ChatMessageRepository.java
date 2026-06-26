package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.createdAt ASC")
    List<ChatMessage> findByChatRoomIdOrderByCreatedAtAsc(@Param("roomId") String roomId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.status = 'seen' WHERE m.chatRoom.id = :roomId AND m.senderId != :currentUserId AND m.status != 'seen'")
    void markMessagesAsSeen(@Param("roomId") String roomId, @Param("currentUserId") Long currentUserId);
}
