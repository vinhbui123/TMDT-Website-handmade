package com.project.web_hand_made_TMDT.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ChatWordFilter {

    private static final List<String> BAD_WORDS = new ArrayList<>();

    static {
        try {
            ClassPathResource resource = new ClassPathResource("bad_words.txt");
            BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), "UTF-8"));
            String line;
            while ((line = reader.readLine()) != null) {
                // Đọc dòng có chứa dữ liệu phân tách bằng dấu phẩy
                if (line.startsWith("['") && line.contains("','")) {
                    String content = line.substring(2, line.length() - 2);
                    String[] words = content.split("','");
                    for (String word : words) {
                        BAD_WORDS.add(word.trim());
                    }
                    break;
                }
            }
            reader.close();
        } catch (Exception e) {
            log.error("Error loading bad words: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra xem tin nhắn có chứa từ ngữ thô tục không
     * @param input Nội dung tin nhắn
     * @return true nếu có từ vi phạm
     */
    public static boolean hasBadWords(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        for (String word : BAD_WORDS) {
            String regex = "(?i)\\b" + Pattern.quote(word) + "\\b";
            String regexNoBoundaries = "(?i)" + Pattern.quote(word);
            if (Pattern.compile(regex).matcher(input).find() || Pattern.compile(regexNoBoundaries).matcher(input).find()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Lọc và thay thế các từ ngữ thô tục bằng dấu sao (***)
     * @param input Nội dung tin nhắn đầu vào
     * @return Nội dung đã được lọc
     */
    public static String filter(String input) {
        if (input == null || input.trim().isEmpty()) {
            return input;
        }

        String filteredMessage = input;
        for (String word : BAD_WORDS) {
            // Sử dụng Regex để thay thế không phân biệt hoa thường
            // (?i) bật chế độ case-insensitive, \b đảm bảo khớp nguyên từ
            String regex = "(?i)\\b" + Pattern.quote(word) + "\\b";
            filteredMessage = filteredMessage.replaceAll(regex, "***");
            
            // Xử lý các từ viết liền hoặc không có khoảng trắng (nếu cần thiết)
            String regexNoBoundaries = "(?i)" + Pattern.quote(word);
            filteredMessage = filteredMessage.replaceAll(regexNoBoundaries, "***");
        }
        return filteredMessage;
    }
}
