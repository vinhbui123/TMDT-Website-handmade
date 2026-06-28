package com.project.web_hand_made_TMDT.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.project.web_hand_made_TMDT.model.ChatRoom;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
    
    @Query("SELECT r FROM ChatRoom r WHERE r.customerId = :userId OR r.shopId = :userId ORDER BY r.updatedAt DESC")
    List<ChatRoom> findByUserIdOrderByUpdatedAtDesc(@Param("userId") int userId);

    @Query("SELECT s.shopName FROM ChatRoom cr " +
       "JOIN User u ON cr.shopId = u.id " +
       "JOIN Shop s ON u.id = s.user.id " +
       "WHERE cr.id = :roomId")
    String findShopNameByRoomId(@Param("roomId") String roomId);

}   
