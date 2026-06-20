import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLoginModule from 'react-facebook-login/dist/facebook-login-render-props';
import '../assets/css/Login.css';

const FacebookLogin = FacebookLoginModule.default || FacebookLoginModule;

const FB_APP_ID = "2143905963130973";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // ========================================================
    // CẬP NHẬT: LƯU TOKEN VÀ ĐỒNG BỘ EVENT ĐĂNG NHẬP TOÀN CỤC
    // ========================================================
    const processLoginResponse = (response, data) => {
        if (response.ok) {
            setSuccess('Đăng nhập thành công!');

            // 1. Lưu thông tin User
            localStorage.setItem('user', JSON.stringify(data.user));

            // 2. Tự động kiểm tra chuỗi Token từ API backend trả về và lưu lại (Thường là data.token hoặc data.accessToken)
            const token = data.token || data.accessToken || data.access_token;
            if (token) {
                localStorage.setItem('token', token);
            }

            // 3. Kích hoạt đồng bộ tức thì cho file App.js nhận diện ngay (Không cần tải lại trang)
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('userLoggedIn'));

            // Redirect shop owners (role === 2) to shop dashboard
            const redirectPath = data.user.role === 2 ? '/ShopDashBoard' : '/';
            setTimeout(() => navigate(redirectPath), 1000);
        } else {
            setError(data.message || 'Đăng nhập thất bại.');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            processLoginResponse(response, data);
        } catch (err) {
            setError('Lỗi kết nối đến server.');
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError('');
            setSuccess('');
            try {
                const response = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });
                const data = await response.json();
                processLoginResponse(response, data);
            } catch (err) {
                setError('Lỗi xác thực Google.');
            }
        },
        onError: () => setError('Đăng nhập Google thất bại.')
    });

    const handleFacebookResponse = async (fbResponse) => {
        if (!fbResponse.accessToken) {
            setError('Đăng nhập Facebook bị hủy.');
            return;
        }
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token: fbResponse.accessToken }),
            });
            const data = await response.json();
            processLoginResponse(response, data);
        } catch (err) {
            setError('Lỗi xác thực Facebook.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-screen">
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="login-title">
                        <h3>Đăng Nhập</h3>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}


                    <div className="login__field">
                        <i className="login__icon fas fa-user"></i>
                        <input
                            type="text"
                            className="login__input"
                            placeholder="Tên đăng nhập hoặc Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login__field">
                        <i className="login__icon fas fa-lock"></i>
                        <input
                            type="password"
                            className="login__input"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{textAlign: 'right', marginBottom: '15px'}}>
                        <Link to="/forgot-password" style={{fontSize: '13px', color: '#888', textDecoration: 'none'}}>Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="login__submit">
                        <span className="button__text">Đăng Nhập</span>
                    </button>

                    <div className="social-login-divider">
                        <span>Hoặc đăng nhập bằng</span>
                    </div>

                    <div className="social-login-container">
                        <div className="google-btn-wrapper">
                            <button type="button" onClick={() => loginWithGoogle()} className="google-custom-btn">
                                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="google-icon" />
                                Google
                            </button>
                        </div>

                        <FacebookLogin
                            appId={FB_APP_ID}
                            autoLoad={false}
                            fields="name,email,picture"
                            callback={handleFacebookResponse}
                            render={renderProps => (
                                <button type="button" onClick={renderProps.onClick} className="fb-login-btn">
                                    <i className="fab fa-facebook-f"></i> Facebook
                                </button>
                            )}
                        />
                    </div>

                    <div className="login__options">
                        <Link to="/register" className="login__link">Bạn chưa có tài khoản? Đăng ký</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;