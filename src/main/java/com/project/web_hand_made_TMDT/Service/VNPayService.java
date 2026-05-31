package com.project.web_hand_made_TMDT.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.project.web_hand_made_TMDT.config.VNPayConfig;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayService {

    @Value("${vnp_TmnCode}")
    private String tmnCode;

    @Value("${vnp_HashSecret}")
    private String hashSecret;

    @Value("${vnp_PayUrl}")
    private String payUrl;

    @Value("${vnp_ReturnUrl}")
    private String returnUrl;

    public String createPaymentUrl(long orderId, long amount, String ipAddress) throws UnsupportedEncodingException {

        // 1. Dùng TreeMap để tự sắp xếp tham số A-Z (Bắt buộc để chữ ký khớp 100%)
        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", tmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100));
        vnp_Params.put("vnp_CurrCode", "VND");

        // Dùng timestamp để tránh trùng mã đơn hàng khi test lại nhiều lần
        vnp_Params.put("vnp_TxnRef", String.valueOf(orderId) + "_" + System.currentTimeMillis());
        vnp_Params.put("vnp_OrderInfo", "Thanh_toan_don_hang_" + orderId);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", returnUrl);

        // Fix IP: VNPay không chấp nhận IPv6 (0:0:0...)
        String vnp_IpAddr = (ipAddress == null || ipAddress.contains("0:0:0:0") || ipAddress.equals("127.0.0.1"))
                ? "127.0.0.1" : ipAddress;
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String createDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", createDate);

        // Thêm thời gian hết hạn (15 phút)
        cld.add(Calendar.MINUTE, 15);
        String expireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", expireDate);

        // 2. Tạo mã băm SecureHash từ VNPayConfig (Sử dụng hàm chuẩn đã fix encode)
        String vnp_SecureHash = VNPayConfig.hashAllFields(vnp_Params, hashSecret);

        // 3. Xây dựng Query String khớp 100% với chuỗi đã băm
        // QUAN TRỌNG: Chỉ encode VALUE, không encode KEY
        StringBuilder query = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = vnp_Params.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            query.append(entry.getKey()); // Giữ nguyên Key
            query.append("=");
            // Encode Value và đổi dấu + thành %20
            query.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString()).replace("+", "%20"));
            if (itr.hasNext()) {
                query.append("&");
            }
        }

        String finalUrl = payUrl + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;

        System.out.println("--- VNPAY DEBUG LOG ---");
        System.out.println("Final URL: " + finalUrl);

        return finalUrl;
    }
}