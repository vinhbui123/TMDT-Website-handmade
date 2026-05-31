package com.project.web_hand_made_TMDT.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_TMDT.Dto.MaterialDTO;
import com.project.web_hand_made_TMDT.Repository.MaterialRepository;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    @Autowired
    private MaterialRepository materialRepository;

    @GetMapping
    public ResponseEntity<List<MaterialDTO>> getAllMaterials() {
//        List<Material> materials = materialRepository.findAll();
        List<MaterialDTO> materials = materialRepository.findAllWithProductCount();
        return ResponseEntity.ok(materials);
    }
}