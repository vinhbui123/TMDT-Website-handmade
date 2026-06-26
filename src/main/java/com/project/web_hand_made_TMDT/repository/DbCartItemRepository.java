package com.project.web_hand_made_TMDT.repository;

import com.project.web_hand_made_TMDT.model.DbCartItem;
import com.project.web_hand_made_TMDT.model.Product;
import com.project.web_hand_made_TMDT.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DbCartItemRepository extends JpaRepository<DbCartItem, Integer> {
    List<DbCartItem> findByUser(User user);
    void deleteByUser(User user);
}
