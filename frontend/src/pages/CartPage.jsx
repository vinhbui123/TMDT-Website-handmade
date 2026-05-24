import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartService from '../services/CartService';

function CartPage() {
    const [cart, setCart] = useState({ items: [], total: 0, cartCount: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + 'đ';
    };

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        try {
            const result = await CartService.getCart();
            if (result.success) {
                setCart({
                    items: result.items || [],
                    total: result.total || 0,
                    cartCount: result.cartCount || 0
                });
            }
        } catch (error) {
            console.error("Lỗi tải giỏ hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === cart.items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cart.items.map(item => item.productId));
        }
    };

    // Hàm tính tổng tiền của các sản phẩm được chọn
    const calculateSelectedTotal = () => {
        return cart.items
            .filter(item => selectedIds.includes(item.productId))
            .reduce((sum, item) => {
                // Ưu tiên dùng giá đã giảm nếu có, không thì dùng giá gốc
                const priceToCalculate = item.discount > 0
                    ? (item.price * (1 - item.discount / 100))
                    : item.price;
                return sum + (priceToCalculate * item.quantity);
            }, 0);
    };

    const handleUpdateQty = async (productId, newQty) => {
        if (newQty < 1) return;
        const result = await CartService.updateQuantity(productId, newQty);
        if (result.success) {
            loadCart();
        }
    };

    const handleRemoveItem = async (productId) => {
        if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            const result = await CartService.removeItem(productId);
            if (result.success) {
                loadCart();
                setSelectedIds(prev => prev.filter(id => id !== productId));
            }
        }
    };

    // --- BƯỚC QUAN TRỌNG: SỬA HÀM CHUYỂN TRANG THANH TOÁN ---
    const handleGoToCheckout = () => {
        if (selectedIds.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }

        const totalToPay = calculateSelectedTotal();

        // Gửi cả danh sách ID và Tổng tiền sang Checkout
        navigate('/checkout', {
            state: {
                selectedProductIds: selectedIds,
                totalAmount: totalToPay // Gửi số tiền thật sang để VNPay sử dụng
            }
        });
    };

    if (loading) return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Đang tải giỏ hàng...</div>;

    return (
        <div className="container cart-page" style={{ padding: '30px 0' }}>
            <h2 style={{ marginBottom: '20px', textTransform: 'uppercase', borderLeft: '4px solid #ee4d2d', paddingLeft: '15px' }}>
                Giỏ hàng của bạn
            </h2>

            {cart.items.length === 0 ? (
                <div className="empty-cart" style={{ textAlign: 'center', padding: '50px' }}>
                    <p style={{ fontSize: '18px', color: '#555' }}>Giỏ hàng của bạn đang trống rỗng!</p>
                    <Link to="/" style={{ color: '#ee4d2d', textDecoration: 'none', fontWeight: 'bold' }}>
                        <i className="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="cart-content">
                    <table className="cart-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                            <th style={{ padding: '15px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === cart.items.length && cart.items.length > 0}
                                />
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Sản phẩm</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Đơn giá</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Số lượng</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Thành tiền</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {cart.items.map((item) => {
                            const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
                            const subtotal = discountedPrice * item.quantity;

                            return (
                                <tr key={item.productId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.productId)}
                                            onChange={() => handleSelectProduct(item.productId)}
                                        />
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <Link to={`/product-detail?id=${item.productId}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                            <img src={item.productImage} alt={item.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '15px' }} />
                                            <span style={{ fontWeight: '500' }}>{item.productName}</span>
                                        </Link>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {item.discount > 0 ? (
                                            <div>
                                                <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>{formatPrice(item.price)}</div>
                                                <div style={{ color: '#ee4d2d', fontWeight: 'bold' }}>{formatPrice(discountedPrice)}</div>
                                            </div>
                                        ) : (
                                            <div style={{ fontWeight: 'bold' }}>{formatPrice(item.price)}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <button onClick={() => handleUpdateQty(item.productId, item.quantity - 1)} style={{ padding: '2px 8px' }}>-</button>
                                            <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                                            <button onClick={() => handleUpdateQty(item.productId, item.quantity + 1)} style={{ padding: '2px 8px' }}>+</button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#ee4d2d' }}>
                                        {formatPrice(subtotal)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button onClick={() => handleRemoveItem(item.productId)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    <div className="cart-summary" style={{ background: '#fff8f7', padding: '20px', borderRadius: '8px', border: '1px solid #ffdbd4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0 }}>Sản phẩm đã chọn: <strong>{selectedIds.length}</strong></p>
                                <h3 style={{ margin: '5px 0' }}>Tổng thanh toán: <span style={{ color: '#ee4d2d' }}>{formatPrice(calculateSelectedTotal())}</span></h3>
                            </div>
                            <div>
                                <button
                                    onClick={handleGoToCheckout}
                                    style={{
                                        background: selectedIds.length === 0 ? '#ccc' : '#ee4d2d',
                                        color: 'white',
                                        padding: '12px 30px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    disabled={selectedIds.length === 0}
                                >
                                    THANH TOÁN NGAY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;