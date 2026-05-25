package com.project.web_hand_made_cd_web.Service;

import com.project.web_hand_made_cd_web.Model.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatbotService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    private final ProductService productService;
    private final RestTemplate restTemplate;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    public ChatbotService(ProductService productService) {
        this.productService = productService;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Xử lý tin nhắn từ người dùng và trả về response từ Groq AI
     */
    public String chat(String userMessage, List<Map<String, String>> conversationHistory) {
        try {
            // Lấy dữ liệu sản phẩm thực từ DB làm context
            String productContext = buildProductContext();

            // Tạo system prompt
            String systemPrompt = buildSystemPrompt(productContext);

            // Tạo danh sách messages cho API
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Thêm lịch sử hội thoại (giới hạn 10 tin nhắn gần nhất)
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                int start = Math.max(0, conversationHistory.size() - 10);
                messages.addAll(conversationHistory.subList(start, conversationHistory.size()));
            }

            // Thêm tin nhắn hiện tại
            messages.add(Map.of("role", "user", "content", userMessage));

            // Gọi Groq API
            return callGroqApi(messages);

        } catch (Exception e) {
            log.error("Lỗi chatbot: ", e);
            return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline 0343 031 030 để được hỗ trợ! 🙏";
        }
    }

    /**
     * Lấy dữ liệu sản phẩm từ DB và format thành text context
     */
    private String buildProductContext() {
        List<Product> topProducts = productService.getTopViewed(10);
        if (topProducts == null || topProducts.isEmpty()) {
            return "Hiện tại chưa có dữ liệu sản phẩm.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("DANH SÁCH SẢN PHẨM NỔI BẬT (Top xem nhiều nhất):\n");
        for (int i = 0; i < topProducts.size(); i++) {
            Product p = topProducts.get(i);
            int finalPrice = p.getDiscount() > 0
                    ? p.getPrice() * (100 - p.getDiscount()) / 100
                    : p.getPrice();

            sb.append(String.format("%d. %s - Giá: %,dđ", i + 1, p.getName(), finalPrice));
            if (p.getDiscount() > 0) {
                sb.append(String.format(" (Giảm %d%%, giá gốc %,dđ)", p.getDiscount(), p.getPrice()));
            }
            sb.append(String.format(" | Lượt xem: %d", p.getView()));
            if (p.getDescription() != null && !p.getDescription().isEmpty()) {
                String desc = p.getDescription().length() > 100
                        ? p.getDescription().substring(0, 100) + "..."
                        : p.getDescription();
                sb.append(" | Mô tả: ").append(desc);
            }
            sb.append("\n");
        }

        // Thêm thông tin tổng sản phẩm
        long totalProducts = productService.getTotalCount();
        sb.append("\nTổng số sản phẩm trong cửa hàng: ").append(totalProducts);

        return sb.toString();
    }

    /**
     * Tạo system prompt cho AI
     */
    private String buildSystemPrompt(String productContext) {
        return """
                Bạn là nhân viên tư vấn của cửa hàng "HANDMADE SHOP" - chuyên bán đồ thủ công handmade.
                
                THÔNG TIN CỬA HÀNG:
                - Tên: HANDMADE SHOP
                - Địa chỉ: Stown Thủ Đức, Bình Chiểu, Thủ Đức, TPHCM
                - Hotline: 0343 031 030
                - Email: handmadedcraft@gmail.com
                - Sản phẩm: Đồ thủ công handmade mang tính mộc mạc, giản dị, có chất riêng
                
                %s
                
                QUY TẮC TRẢ LỜI:
                1. Trả lời bằng tiếng Việt, thân thiện, nhiệt tình
                2. Tư vấn dựa trên dữ liệu sản phẩm thực ở trên
                3. Nếu khách hỏi sản phẩm không có trong danh sách, hãy gợi ý sản phẩm tương tự hoặc mời khách xem thêm trên website
                4. Giữ câu trả lời ngắn gọn (tối đa 200 từ)
                5. Sử dụng emoji phù hợp để tạo cảm giác thân thiện
                6. Khi nói về giá, format dạng VNĐ có dấu chấm phân cách
                7. Nếu khách hỏi ngoài phạm vi sản phẩm, lịch sự chuyển hướng về sản phẩm shop
                """.formatted(productContext);
    }

    /**
     * Gọi Groq API
     */
    @SuppressWarnings("unchecked")
    private String callGroqApi(List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 512);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                GROQ_API_URL,
                HttpMethod.POST,
                entity,
                Map.class
        );

        if (response.getBody() != null) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }

        return "Xin lỗi, tôi không thể xử lý yêu cầu lúc này. Vui lòng thử lại! 🙏";
    }
}
