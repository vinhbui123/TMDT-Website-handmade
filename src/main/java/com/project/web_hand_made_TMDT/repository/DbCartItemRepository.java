package com.project.web_hand_made_TMDT.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.model.DbCartItem;
import com.project.web_hand_made_TMDT.model.User;

@Repository
public interface DbCartItemRepository extends JpaRepository<DbCartItem, Integer> {
    List<DbCartItem> findByUser(User user);
    void deleteByUser(User user);
}
