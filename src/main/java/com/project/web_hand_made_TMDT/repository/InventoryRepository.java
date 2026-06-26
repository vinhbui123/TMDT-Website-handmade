package com.project.web_hand_made_TMDT.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.model.Inventory;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
}
