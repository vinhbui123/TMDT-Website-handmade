package com.project.web_hand_made_TMDT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.web_hand_made_TMDT.Model.Inventory;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
}
