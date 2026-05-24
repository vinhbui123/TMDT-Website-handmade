package com.project.web_hand_made_cd_web.config;

import jakarta.servlet.http.HttpServletRequest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class VNPayConfig {

    public static String hashAllFields(Map<String, String> fields, String secretKey) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        System.out.println("--- BẮT ĐẦU TẠO CHUỖI BĂM (HASH) ---"); // Log bắt đầu

        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                sb.append(fieldName).append("=");
                try {
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()).replace("+", "%20");
                    sb.append(encodedValue);

                    // Hiện ra màn hình từng cặp tham số đã encode
                    System.out.println("Field: " + fieldName + " => " + encodedValue);

                } catch (Exception e) {
                    sb.append(fieldValue);
                }
                if (itr.hasNext()) sb.append("&");
            }
        }

        String dataToHash = sb.toString();
        // CỰC KỲ QUAN TRỌNG: Kiểm tra chuỗi cuối cùng này
        System.out.println("=> CHUỖI GỐC TRƯỚC KHI BĂM: " + dataToHash);
        System.out.println("=> SECRET KEY ĐANG DÙNG: " + secretKey);

        String result = hmacSHA512(secretKey, dataToHash);
        System.out.println("=> MÃ SECURE HASH TẠO RA: " + result);
        System.out.println("--- KẾT THÚC TẠO CHUỖI BĂM ---");

        return result;
    }

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) return "";
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);

            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            System.err.println("LỖI KHI MÃ HÓA SHA512: " + ex.getMessage());
            return "";
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        if (ipAddress.equals("0:0:0:0:0:0:0:1")) {
            ipAddress = "127.0.0.1";
        }
        System.out.println("IP ADDRESS CỦA KHÁCH: " + ipAddress);
        return ipAddress;
    }
}