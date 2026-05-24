package com.project.web_hand_made_cd_web.Repository;

import com.project.web_hand_made_cd_web.Model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdOrderByCreatedAtDesc(int userId);
}