import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/UpdateProfile.css';

const UpdateProfile = () => {
    // --- STATE HỒ SƠ USER ---
    const [userId, setUserId] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [userRole, setUserRole] = useState(0);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    // --- STATE ĐĂNG KÝ SHOP ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shopName, setShopName] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [description, setDescription] = useState('');
    const [shopLogoUrl, setShopLogoUrl] = useState('');
    const [shopLogoFile, setShopLogoFile] = useState(null);
    const [shopStatus, setShopStatus] = useState('FORM'); // 'FORM', 'PENDING', 'APPROVED', 'REJECTED'
    const [shopError, setShopError] = useState('');
    const [shopSuccess, setShopSuccess] = useState('');

    // --- TÍCH HỢP STATE OTP CHO SHOP ---
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    const fileInputRef = useRef(null);
    const shopLogoInputRef = useRef(null);
    const navigate = useNavigate();

    // Tải thông tin User & Trạng thái Shop từ Database
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Lấy thông tin tài khoản hiện tại từ database
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const user = await res.json();
                    setUserId(user.id);
                    setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
                    setEmail(user.email || '');
                    setPhoneNumber(user.phoneNumber || '');
                    setAddress(user.address || '');
                    setBio(user.bio || '');
                    setAvatarUrl(user.avatar || '');
                    setUserRole(user.role || 0);
                }

                if (window.location.pathname === '/register-shop') {
                    setIsModalOpen(true);
                }

                // 2. Lấy thông tin trạng thái shop từ database
                const resShop = await fetch('/api/auth/my-shop', { credentials: 'include' });
                if (resShop.ok) {
                    const shopData = await resShop.json();
                    if (shopData) {
                        setShopName(shopData.shop_name || '');
                        setShopAddress(shopData.shop_address || '');
                        setDescription(shopData.description || '');
                        setShopLogoUrl(shopData.shop_logo || '');

                        if (shopData.status === 0) setShopStatus('PENDING');
                        else if (shopData.status === 1) setShopStatus('APPROVED');
                        else if (shopData.status === 2) setShopStatus('REJECTED');
                    }
                } else {
                    setShopStatus('FORM');
                }
            } catch (err) {
                console.error('Lỗi kết nối cơ sở dữ liệu backend:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    // 🔥 FIX LỖI 413: Kiểm tra dung lượng ảnh Logo trước khi nhận (< 2MB)
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxFileSize = 2 * 1024 * 1024; // 2 Megabytes
            if (file.size > maxFileSize) {
                setShopError("File ảnh logo quá lớn! Vui lòng chọn file khác dưới 2MB.");
                e.target.value = null; // Xóa file lỗi khỏi input
                return;
            }
            setShopError('');
            setShopLogoFile(file);
            setShopLogoUrl(URL.createObjectURL(file));
        }
    };

    // Lưu Profile User
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('phoneNumber', phoneNumber);
        formData.append('address', address);
        formData.append('bio', bio);
        if (avatarFile) formData.append('avatarUpload', avatarFile);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || 'Cập nhật thông tin thành công.');
            } else {
                setError(data.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server.');
        }
    };

    // --- HÀM GỬI MÃ OTP MỞ SHOP VỀ EMAIL (ĐÃ ĐỒNG BỘ ID AN TOÀN) ---
    const handleSendShopOtp = async () => {
        if (!shopName.trim() || !shopAddress.trim()) {
            setShopError("Vui lòng nhập Tên cửa hàng và Địa chỉ trước khi nhận mã OTP!");
            return;
        }

        setSendingOtp(true);
        setShopError('');
        setShopSuccess('');
        setOtp('');
        setOtpSent(true);

        try {
            // Lấy ID người dùng đồng bộ từ State hoặc LocalStorage, loại bỏ ID cứng số 33 gây lỗi
            const storedUser = localStorage.getItem('user');
            const currentUser = storedUser ? JSON.parse(storedUser) : null;
            const currentUserId = userId || currentUser?.id;

            if (!currentUserId) {
                setShopError("Không xác định được ID người dùng. Vui lòng đăng nhập lại!");
                setOtpSent(false);
                setSendingOtp(false);
                return;
            }

            const res = await fetch(`/api/auth/shop-send-otp?user_id=${currentUserId}&shop_name=${encodeURIComponent(shopName)}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setShopSuccess(data.message || "Mã OTP mới đã được gửi về email của bạn!");
            } else {
                setOtpSent(false);
                setShopError(data.message || "Gửi mã OTP thất bại.");
            }
        } catch (err) {
            setOtpSent(false);
            setShopError("Lỗi kết nối đến máy chủ.");
        } finally {
            setSendingOtp(false);
        }
    };

    // --- GỬI YÊU CẦU ĐĂNG KÝ SHOP (ĐÃ ĐỒNG BỘ ID TRÁNH SAI OTP) ---
    const handleRegisterShopSubmit = async (e) => {
        e.preventDefault();
        setShopError('');
        setShopSuccess('');

        if (!otp.trim()) {
            setShopError("Vui lòng nhập mã OTP xác thực trước khi gửi đơn đăng ký!");
            return;
        }

        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const currentUserId = userId || currentUser?.id;

        if (!currentUserId) {
            setShopError("Không xác định được ID người dùng. Vui lòng đăng nhập lại!");
            return;
        }

        const formData = new FormData();
        formData.append('shop_name', shopName);
        formData.append('shop_address', shopAddress);
        formData.append('description', description);
        formData.append('otp', otp.trim());
        formData.append('user_id', currentUserId);

        if (shopLogoFile) {
            formData.append('file', shopLogoFile);
        }

        try {
            const response = await fetch('/api/auth/register-shop', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            // Đọc phản hồi dưới dạng text thô trước để tránh lỗi Unexpected end of JSON
            const textData = await response.text();
            let data = {};

            if (textData && textData.trim().length > 0) {
                try {
                    data = JSON.parse(textData);
                } catch (parseErr) {
                    console.error("Lỗi parse cấu trúc dữ liệu phản hồi:", parseErr);
                }
            }

            if (response.ok) {
                setShopSuccess(data.message || 'Gửi đơn đăng ký thành công! Đang chờ Admin phê duyệt.');
                setShopStatus('PENDING');
                setOtp('');
                setOtpSent(false);
            } else {
                setShopError(data.message || `Yêu cầu không thành công. Mã phản hồi từ Server: ${response.status}`);
            }
        } catch (err) {
            console.error("Chi tiết lỗi kết nối hệ thống:", err);
            setShopError('Không thể hoàn tất kết nối tới máy chủ dữ liệu.');
        }
    };

    // Hàm xử lý hủy đơn đăng ký shop khi trạng thái là PENDING
    const handleCancelRegisterShop = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đăng ký mở gian hàng này không?")) {
            return;
        }

        setShopError('');
        setShopSuccess('');

        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const currentUserId = userId || currentUser?.id;

        if (!currentUserId) {
            setShopError("Không xác định được ID người dùng.");
            return;
        }

        try {
            const response = await fetch(`/api/auth/cancel-shop/${currentUserId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setShopSuccess('Đã hủy đơn đăng ký mở cửa hàng thành công.');
                setShopStatus('FORM');
                setShopName('');
                setShopAddress('');
                setDescription('');
                setShopLogoUrl('');
                setShopLogoFile(null);
                setOtp('');
                setOtpSent(false);
            } else {
                setShopError(data.message || 'Không thể hủy đơn. Vui lòng thử lại sau.');
            }
        } catch (err) {
            setShopError('Lỗi kết nối server, không thể hủy yêu cầu mở gian hàng.');
        }
    };

    if (loading) return <div className="profile-container"><p>Đang tải...</p></div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <form onSubmit={handleSubmit}>
                    <div className="profile-header">
                        <h3>Thông Tin Tài Khoản</h3>
                        <p>Quản lý thông tin cá nhân của bạn</p>
                    </div>

                    {error && <div className="profile-alert error"><i className="fas fa-exclamation-circle" style={{marginRight: '8px'}}></i>{error}</div>}
                    {success && <div className="profile-alert success"><i className="fas fa-check-circle" style={{marginRight: '8px'}}></i>{success}</div>}

                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper">
                            <img src={avatarUrl || '/images/default-avatar.png'} alt="Avatar" className="profile-avatar-img" onError={(e) => { e.target.src = '/images/default-avatar.png' }} />
                            <div className="profile-avatar-upload-btn" onClick={() => fileInputRef.current.click()}><i className="fas fa-camera"></i> Thay đổi</div>
                            <input type="file" accept="image/*" className="profile-file-input" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                    </div>

                    <div className="profile-form-grid">
                        <div className="profile-input-group">
                            <label>Họ và Tên</label>
                            <input type="text" className="profile-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            <i className="fas fa-user"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Email</label>
                            <input type="email" className="profile-input" value={email} disabled required />
                            <i className="fas fa-envelope"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Số Điện Thoại</label>
                            <input type="text" className="profile-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                            <i className="fas fa-phone"></i>
                        </div>

                        <div className="profile-input-group">
                            <label>Địa Chỉ</label>
                            <input type="text" className="profile-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                            <i className="fas fa-map-marker-alt"></i>
                        </div>

                        <div className="profile-input-group full-width">
                            <label>Tiểu Sử (Bio)</label>
                            <textarea className="profile-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
                            <i className="fas fa-info-circle" style={{top: '30px'}}></i>
                        </div>

                        <div className="full-width" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" className="profile-btn" style={{ flex: 1, margin: 0 }}>
                                <i className="fas fa-save" style={{marginRight: '8px'}}></i> Lưu Thay Đổi
                            </button>

                            {userRole !== 2 && (
                                <button
                                    type="button"
                                    className="profile-btn"
                                    style={{ flex: 1, margin: 0, backgroundColor: shopStatus === 'PENDING' ? '#f39c12' : '#e67e22' }}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <i className="fas fa-store" style={{marginRight: '8px'}}></i>
                                    {shopStatus === 'PENDING' && 'Xem Đơn Mở Shop (Chờ duyệt)'}
                                    {shopStatus === 'REJECTED' && 'Sửa Đơn Mở Shop (Bị từ chối)'}
                                    {shopStatus === 'FORM' && 'Đăng Ký Mở Gian Hàng'}
                                </button>
                            )}

                            {userRole === 2 && (
                                <button type="button" className="profile-btn" style={{ flex: 1, margin: 0, backgroundColor: '#2ecc71' }} onClick={() => navigate('/ShopDashBoard')}>
                                    <i className="fas fa-chart-line" style={{marginRight: '8px'}}></i> Vào Kênh Người Bán
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* MODAL ĐĂNG KÝ SHOP POP-UP */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div className="profile-card" style={{ width: '550px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>&times;</button>

                        <form onSubmit={handleRegisterShopSubmit}>
                            <div className="profile-header">
                                <h3>Đăng Ký Mở Cửa Hàng</h3>
                                {shopStatus === 'FORM' && <p>Vui lòng điền thông tin để gửi yêu cầu mở shop</p>}
                                {shopStatus === 'PENDING' && <p style={{color: '#f39c12', fontWeight: 'bold'}}>TRẠNG THÁI: ĐANG CHỜ DUYỆT (status = 0)</p>}
                                {shopStatus === 'REJECTED' && <p style={{color: '#e74c3c', fontWeight: 'bold'}}>TRẠNG THÁI: BỊ TỪ CHỐI (Vui lòng sửa lại đơn mới)</p>}
                                {shopStatus === 'APPROVED' && <p style={{color: '#2ecc71', fontWeight: 'bold'}}>TRẠNG THÁI: ĐÃ PHÊ DUYỆT THÀNH CÔNG 🎉</p>}
                            </div>

                            {shopError && <div className="profile-alert error">{shopError}</div>}
                            {shopSuccess && <div className="profile-alert success">{shopSuccess}</div>}

                            <div className="profile-avatar-section" style={{marginBottom: '15px'}}>
                                <div className="profile-avatar-wrapper" style={{width: '100px', height: '100px'}}>
                                    <img src={shopLogoUrl || '/images/default-shop-logo.png'} alt="Shop Logo" className="profile-avatar-img" onError={(e) => { e.target.src = '/images/default-shop-logo.png' }} />
                                    {(shopStatus === 'FORM' || shopStatus === 'REJECTED') && (
                                        <>
                                            <div className="profile-avatar-upload-btn" onClick={() => shopLogoInputRef.current.click()} style={{fontSize: '11px'}}><i className="fas fa-camera"></i> Tải Logo</div>
                                            <input type="file" accept="image/*" className="profile-file-input" ref={shopLogoInputRef} onChange={handleLogoChange}/>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="profile-form-grid" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                <div className="profile-input-group full-width" style={{margin: 0}}>
                                    <label>Tên Cửa Hàng</label>
                                    <input type="text" className="profile-input" value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={shopStatus === 'PENDING' || shopStatus === 'APPROVED'} required />
                                    <i className="fas fa-store" style={{bottom: '12px'}}></i>
                                </div>

                                <div className="profile-input-group full-width" style={{margin: 0}}>
                                    <label>Địa Chỉ Cửa Hàng</label>
                                    <input type="text" className="profile-input" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} disabled={shopStatus === 'PENDING' || shopStatus === 'APPROVED'} required />
                                    <i className="fas fa-map-marked-alt" style={{bottom: '12px'}}></i>
                                </div>

                                <div className="profile-input-group full-width" style={{margin: 0}}>
                                    <label>Mô Tả Sản Phẩm Kinh Doanh</label>
                                    <textarea className="profile-textarea" value={description} onChange={(e) => setDescription(e.target.value)} disabled={shopStatus === 'PENDING' || shopStatus === 'APPROVED'} style={{height: '80px'}} />
                                    <i className="fas fa-info-circle" style={{top: '32px'}}></i>
                                </div>

                                {/* --- KHU VỰC OTP --- */}
                                {(shopStatus === 'FORM' || shopStatus === 'REJECTED') && (
                                    <div style={{ marginTop: '5px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', border: '1px dashed #dee2e6' }}>
                                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#2c3e50', fontSize: '13px' }}>
                                            <i className="fas fa-shield-alt" style={{ marginRight: '6px', color: '#e67e22' }}></i>Xác thực mã OTP mở gian hàng
                                        </label>

                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ margin: 0, flex: 1, position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Nhập 6 số OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    disabled={!otpSent}
                                                    maxLength={6}
                                                    style={{ letterSpacing: '2px', fontWeight: 'bold', textAlign: 'center', height: '38px', width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSendShopOtp}
                                                disabled={sendingOtp}
                                                style={{
                                                    padding: '0 15px',
                                                    height: '38px',
                                                    backgroundColor: otpSent ? '#27ae60' : '#2980b9',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {sendingOtp ? 'Đang gửi...' : (otpSent ? 'Gửi Lại Mã' : 'Nhận Mã OTP')}
                                            </button>
                                        </div>
                                        <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px', fontSize: '11px' }}>
                                            Mã OTP sẽ được gửi về Email liên kết với tài khoản này của bạn.
                                        </small>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" className="profile-btn" style={{backgroundColor: '#7f8c8d', margin: 0, flex: 1}} onClick={() => setIsModalOpen(false)}>Đóng lại</button>

                                    {shopStatus === 'PENDING' && (
                                        <button type="button" className="profile-btn" style={{backgroundColor: '#d35400', margin: 0, flex: 1}} onClick={handleCancelRegisterShop}>
                                            <i className="fas fa-ban" style={{marginRight: '6px'}}></i> Hủy Gửi Đơn
                                        </button>
                                    )}

                                    {(shopStatus === 'FORM' || shopStatus === 'REJECTED') && (
                                        <button type="submit" className="profile-btn" style={{margin: 0, flex: 2, backgroundColor: '#e67e22'}}>
                                            <i className="fas fa-paper-plane" style={{marginRight: '6px'}}></i>
                                            {shopStatus === 'REJECTED' ? 'Gửi Lại Đơn Mới' : 'Gửi Đăng Ký'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateProfile;