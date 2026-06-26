package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    
    @Query("SELECT r FROM ChatRoom r WHERE r.customerId = :userId OR r.shopId = :userId ORDER BY r.updatedAt DESC")
    List<ChatRoom> findByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);
}
