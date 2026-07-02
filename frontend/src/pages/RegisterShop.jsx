import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CCCD_REGEX = /^\d{12}$/;

function RegisterShop() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shopData, setShopData] = useState(null);
    const [status, setStatus] = useState(null); // null = chưa có, 0 = Pending, 1 = Approved, 2 = Rejected
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        shopName: '',
        description: '',
        shopAddress: '',
        ownerName: '',
        identityCardNumber: '',
        taxCode: ''
    });

    const [files, setFiles] = useState({
        file: null, // logo
        identityCardFront: null,
        identityCardBack: null
    });

    useEffect(() => {
        fetchShopProfile();
    }, []);

    const fetchShopProfile = async () => {
        try {
            const res = await fetch('/api/shop/profile/me', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setShopData(data);
                setStatus(data.status);
                if (data.status === 2) {
                    // Nếu bị từ chối, load lại data cũ để họ sửa
                    setFormData({
                        shopName: data.shopName || '',
                        description: data.description || '',
                        shopAddress: data.shopAddress || '',
                        ownerName: data.ownerName || '',
                        identityCardNumber: data.identityCardNumber || '',
                        taxCode: data.taxCode || ''
                    });
                }
            } else if (res.status === 401) {
                navigate('/login');
            }
        } catch (err) {
            console.error('Lỗi khi lấy thông tin shop:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList.length > 0) {
            setFiles({ ...files, [name]: fileList[0] });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.shopName.trim()) newErrors.shopName = 'Tên shop không được để trống.';
        if (!formData.shopAddress.trim()) newErrors.shopAddress = 'Địa chỉ shop không được để trống.';
        if (!formData.ownerName.trim()) newErrors.ownerName = 'Họ tên chủ shop không được để trống.';
        if (!formData.identityCardNumber.trim()) {
            newErrors.identityCardNumber = 'Số CCCD không được để trống.';
        } else if (!CCCD_REGEX.test(formData.identityCardNumber.trim())) {
            newErrors.identityCardNumber = 'Số CCCD phải gồm đúng 12 chữ số.';
        }

        // Validate file size
        Object.keys(files).forEach(key => {
            if (files[key] && files[key].size > MAX_FILE_SIZE) {
                newErrors[key] = `File "${files[key].name}" vượt quá 5MB.`;
            }
        });

        // Validate required files (nếu chưa có shopData)
        if (!shopData?.shopLogo && !files.file) newErrors.file = 'Vui lòng chọn logo shop.';
        if (!shopData?.identityCardFront && !files.identityCardFront) newErrors.identityCardFront = 'Vui lòng chọn ảnh CCCD mặt trước.';
        if (!shopData?.identityCardBack && !files.identityCardBack) newErrors.identityCardBack = 'Vui lòng chọn ảnh CCCD mặt sau.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setMessage('');

        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });
        Object.keys(files).forEach(key => {
            if (files[key]) {
                formDataToSend.append(key, files[key]);
            }
        });

        try {
            const res = await fetch('/api/shop/profile/me', {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage(data.message || 'Đăng ký thành công!');
                setStatus(0); // Chuyển sang Pending
            } else if (res.status === 401) {
                navigate('/login');
            } else {
                setMessage(data.message || 'Có lỗi xảy ra.');
            }
        } catch (err) {
            setMessage('Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 0) {
        return (
            <div className="container" style={{ padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <i className="fas fa-clock" style={{ fontSize: '60px', color: '#f39c12', marginBottom: '20px' }}></i>
                    <h2 style={{ color: '#333' }}>Hồ sơ đang chờ duyệt</h2>
                    <p style={{ color: '#666', marginTop: '15px', lineHeight: '1.6' }}>
                        Hồ sơ đăng ký bán hàng của bạn đã được gửi thành công và đang trong quá trình chờ Ban Quản Trị xét duyệt. 
                        Quá trình này có thể mất từ 1-2 ngày làm việc. Vui lòng quay lại sau!
                    </p>
                    <button onClick={() => navigate('/')} className="btn" style={{ marginTop: '25px', background: '#ee4d2d', color: '#fff', padding: '10px 20px', borderRadius: '4px', border: 'none' }}>
                        Trở về Trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (status === 1) {
        return (
            <div className="container" style={{ padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '60px', color: '#2ecc71', marginBottom: '20px' }}></i>
                    <h2 style={{ color: '#333' }}>Đăng ký thành công!</h2>
                    <p style={{ color: '#666', marginTop: '15px', lineHeight: '1.6' }}>
                        Chúc mừng bạn đã trở thành Người Bán Hàng chính thức trên HandMade. Hãy bắt đầu quản lý cửa hàng của bạn ngay bây giờ.
                    </p>
                    <button onClick={() => window.location.href = '/ShopDashBoard'} className="btn" style={{ marginTop: '25px', background: '#ee4d2d', color: '#fff', padding: '10px 20px', borderRadius: '4px', border: 'none' }}>
                        Đến Kênh Người Bán
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h2 style={{ textAlign: 'center', color: '#ee4d2d', marginBottom: '30px', fontWeight: 'bold' }}>
                    ĐĂNG KÝ TRỞ THÀNH NGƯỜI BÁN HÀNG
                </h2>

                {message && (
                    <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', background: message.includes('Lỗi') ? '#ffebee' : '#e8f5e9', color: message.includes('Lỗi') ? '#c62828' : '#2e7d32' }}>
                        {message}
                    </div>
                )}

                {status === 2 && (
                    <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', background: '#ffebee', color: '#c62828', fontWeight: 'bold' }}>
                        ⚠️ Hồ sơ trước đó của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin chính xác và gửi lại.
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: '10px' }}>1. Thông tin gian hàng</h4>
                    
                    <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Tên Shop <span style={{color: 'red'}}>*</span></label>
                        <input type="text" name="shopName" value={formData.shopName} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: errors.shopName ? '1px solid red' : '1px solid #ddd' }} required />
                        {errors.shopName && <span style={{ color: 'red', fontSize: '13px' }}>{errors.shopName}</span>}
                    </div>

                    <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Địa chỉ Shop <span style={{color: 'red'}}>*</span></label>
                        <input type="text" name="shopAddress" value={formData.shopAddress} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: errors.shopAddress ? '1px solid red' : '1px solid #ddd' }} required />
                        {errors.shopAddress && <span style={{ color: 'red', fontSize: '13px' }}>{errors.shopAddress}</span>}
                    </div>

                    <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Mô tả Shop</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px' }} />
                    </div>

                    <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Logo Shop <span style={{color: 'red'}}>*</span></label>
                        <input type="file" name="file" onChange={handleFileChange} className="form-control" style={{ width: '100%', padding: '10px', border: errors.file ? '1px dashed red' : '1px dashed #ddd', borderRadius: '6px' }} required={!shopData?.shopLogo} accept="image/*" />
                        {errors.file && <span style={{ color: 'red', fontSize: '13px' }}>{errors.file}</span>}
                        {shopData?.shopLogo && <img src={shopData.shopLogo} alt="Logo" style={{ width: '80px', height: '80px', marginTop: '10px', borderRadius: '8px', objectFit: 'cover' }} />}
                    </div>

                    <h4 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>2. Thông tin pháp lý (Định danh)</h4>

                    <div>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Họ và tên Chủ Shop <span style={{color: 'red'}}>*</span></label>
                        <input type="text" name="ownerName" value={formData.ownerName} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: errors.ownerName ? '1px solid red' : '1px solid #ddd' }} required />
                        {errors.ownerName && <span style={{ color: 'red', fontSize: '13px' }}>{errors.ownerName}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Số CCCD <span style={{color: 'red'}}>*</span></label>
                            <input type="text" name="identityCardNumber" value={formData.identityCardNumber} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: errors.identityCardNumber ? '1px solid red' : '1px solid #ddd' }} required maxLength={12} />
                            {errors.identityCardNumber && <span style={{ color: 'red', fontSize: '13px' }}>{errors.identityCardNumber}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Mã số thuế (nếu có)</label>
                            <input type="text" name="taxCode" value={formData.taxCode} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Ảnh CCCD (Mặt trước) <span style={{color: 'red'}}>*</span></label>
                            <input type="file" name="identityCardFront" onChange={handleFileChange} className="form-control" style={{ width: '100%', padding: '10px', border: errors.identityCardFront ? '1px dashed red' : '1px dashed #ddd', borderRadius: '6px' }} required={!shopData?.identityCardFront} accept="image/*" />
                            {errors.identityCardFront && <span style={{ color: 'red', fontSize: '13px', display: 'block' }}>{errors.identityCardFront}</span>}
                            {shopData?.identityCardFront && <img src={shopData.identityCardFront} alt="CCCD Front" style={{ width: '100%', maxHeight: '150px', marginTop: '10px', borderRadius: '8px', objectFit: 'contain' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Ảnh CCCD (Mặt sau) <span style={{color: 'red'}}>*</span></label>
                            <input type="file" name="identityCardBack" onChange={handleFileChange} className="form-control" style={{ width: '100%', padding: '10px', border: errors.identityCardBack ? '1px dashed red' : '1px dashed #ddd', borderRadius: '6px' }} required={!shopData?.identityCardBack} accept="image/*" />
                            {errors.identityCardBack && <span style={{ color: 'red', fontSize: '13px', display: 'block' }}>{errors.identityCardBack}</span>}
                            {shopData?.identityCardBack && <img src={shopData.identityCardBack} alt="CCCD Back" style={{ width: '100%', maxHeight: '150px', marginTop: '10px', borderRadius: '8px', objectFit: 'contain' }} />}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '20px',
                        width: '100%', padding: '16px',
                        background: loading ? '#ccc' : '#ee4d2d',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        fontWeight: 'bold', fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer'
                    }}>
                        {loading ? 'ĐANG GỬI HỒ SƠ...' : 'GỬI HỒ SƠ ĐĂNG KÝ'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegisterShop;
