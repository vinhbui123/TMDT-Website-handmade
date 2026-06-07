package com.project.web_hand_made_TMDT.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.project.web_hand_made_TMDT.model.Color;
import com.project.web_hand_made_TMDT.repository.ColorRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ColorService {
    private final ColorRepository colorRepository;

    // Hàm lấy tất cả các màu sắc đang có trong cơ sở dữ liệu
    public List<Color> getAllColors() {
        return colorRepository.findAll();
    }
}