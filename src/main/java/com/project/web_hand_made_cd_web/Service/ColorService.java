package com.project.web_hand_made_cd_web.Service;

import com.project.web_hand_made_cd_web.Model.Color;
import com.project.web_hand_made_cd_web.Repository.ColorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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