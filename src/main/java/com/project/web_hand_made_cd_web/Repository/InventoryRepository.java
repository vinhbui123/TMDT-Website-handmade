package com.project.web_hand_made_cd_web.Repository;

import com.project.web_hand_made_cd_web.Model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
}
