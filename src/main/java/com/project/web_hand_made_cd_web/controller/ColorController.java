package com.project.web_hand_made_cd_web.controller;

import com.project.web_hand_made_cd_web.Model.Color;
import com.project.web_hand_made_cd_web.Service.ColorService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ColorController {
    @Autowired
    private final ColorService colorService;

    // 2. Thêm endpoint này vào trong class ProductController:
    @GetMapping("/colors")
    public ResponseEntity<List<Color>> getAllColors() {
        List<Color> colors = colorService.getAllColors();
        return ResponseEntity.ok(colors);
    }
}