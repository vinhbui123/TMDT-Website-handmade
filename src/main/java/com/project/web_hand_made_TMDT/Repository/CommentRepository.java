package com.project.web_hand_made_TMDT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.Model.Comment;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    List<Comment> findByProductIdOrderByCreateAtDesc(int productId);
    Comment findByProductIdAndUserId(int productId, int userId);
}
