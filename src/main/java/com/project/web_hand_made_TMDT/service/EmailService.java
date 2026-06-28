package com.project.web_hand_made_TMDT.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // Hàm 1: Gửi OTP Khôi phục mật khẩu (Giữ nguyên của bạn)
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã xác nhận khôi phục mật khẩu - HandMade");
        message.setText("Chào bạn,\n\n"
                + "Bạn đã yêu cầu khôi phục mật khẩu. Dưới đây là mã OTP của bạn:\n\n"
                + "Mã OTP: " + otp + "\n\n"
                + "Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ HandMade");

        mailSender.send(message);
    }

    // --- BỔ SUNG THÊM ---
    // Hàm 2: Gửi OTP Xác thực đăng ký mở Shop gian hàng
    public void sendShopRegisterOtpEmail(String toEmail, String shopName, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã OTP xác thực đăng ký mở cửa hàng - HandMade");
        message.setText("Chào bạn,\n\n"
                + "Hệ thống ghi nhận yêu cầu đăng ký mở cửa hàng với tên \"" + shopName + "\" từ tài khoản của bạn.\n"
                + "Dưới đây là mã OTP xác thực của bạn:\n\n"
                + "Mã OTP: " + otp + "\n\n"
                + "Mã này có hiệu lực trong vòng 5 phút. Vui lòng hoàn tất biểu mẫu đăng ký.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ HandMade");

        mailSender.send(message);
    }
}