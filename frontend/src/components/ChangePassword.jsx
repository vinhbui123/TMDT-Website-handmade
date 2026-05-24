import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/ChangePassword.css';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSuccess(data.message || 'Đổi mật khẩu thành công. Các máy khác đã bị đăng xuất.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Optionally redirect to home after 2 seconds
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError(data.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server.');
        }
    };

    return (
        <div className="change-password-container">
            <div className="change-password-card">
                <form onSubmit={handleSubmit}>
                    <div className="cp-header">
                        <h3>Đổi Mật Khẩu</h3>
                        <p>Bảo vệ tài khoản của bạn bằng một mật khẩu an toàn</p>
                    </div>

                    {error && <div className="cp-alert error"><i className="fas fa-exclamation-circle" style={{marginRight: '8px'}}></i>{error}</div>}
                    {success && <div className="cp-alert success"><i className="fas fa-check-circle" style={{marginRight: '8px'}}></i>{success}</div>}

                    <div className="cp-input-group">
                        <input
                            type="password"
                            className="cp-input"
                            placeholder="Mật khẩu hiện tại"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <i className="fas fa-unlock-alt"></i>
                    </div>

                    <div className="cp-input-group">
                        <input
                            type="password"
                            className="cp-input"
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <i className="fas fa-key"></i>
                    </div>

                    <div className="cp-input-group">
                        <input
                            type="password"
                            className="cp-input"
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <i className="fas fa-check-double"></i>
                    </div>

                    <button type="submit" className="cp-btn">
                        <i className="fas fa-save" style={{marginRight: '8px'}}></i> Cập nhật mật khẩu
                    </button>
                    
                    <button type="button" onClick={() => navigate('/')} className="cp-back-btn">
                        <i className="fas fa-arrow-left" style={{marginRight: '5px'}}></i> Quay lại trang chủ
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
