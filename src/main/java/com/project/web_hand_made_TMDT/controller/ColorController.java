package com.project.web_hand_made_TMDT.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.web_hand_made_TMDT.Model.Color;
import com.project.web_hand_made_TMDT.Service.ColorService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ColorController {
    private final ColorService colorService;

    // 2. Thêm endpoint này vào trong class ProductController:
    @GetMapping("/colors")
    public ResponseEntity<List<Color>> getAllColors() {
        List<Color> colors = colorService.getAllColors();
        return ResponseEntity.ok(colors);
    }
}