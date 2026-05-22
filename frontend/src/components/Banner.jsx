import { useState, useEffect, useCallback, useRef } from 'react'
import '../assets/css/Banner.css'

// Placeholder banner images using gradient backgrounds
const defaultBanners = [
  { id: 1, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', title: 'Sản Phẩm Handmade', subtitle: 'Chất lượng tốt nhất' },
  { id: 2, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', title: 'Giảm Giá Đặc Biệt', subtitle: 'Lên đến 50%' },
  { id: 3, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', title: 'Bộ Sưu Tập Mới', subtitle: 'Khám phá ngay' },
  { id: 4, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', title: 'Quà Tặng Handmade', subtitle: 'Ý nghĩa & Độc đáo' },
  { id: 5, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', title: 'Miễn Phí Vận Chuyển', subtitle: 'Cho đơn từ 500k' },
]

function Banner({ bannerImages }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef(null)
  const banners = bannerImages && bannerImages.length > 0 ? bannerImages : defaultBanners

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 4000)
  }, [banners.length])

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const changeBanner = (step) => {
    stopAutoPlay()
    setCurrentIndex(prev => (prev + step + banners.length) % banners.length)
    startAutoPlay()
  }

  const goToSlide = (index) => {
    stopAutoPlay()
    setCurrentIndex(index)
    startAutoPlay()
  }

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [startAutoPlay, stopAutoPlay])

  return (
    <div
      className="mainBanner"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      <div className="banner-show">
        <button className="banner-btn prev" onClick={() => changeBanner(-1)}>
          &#10094;
        </button>

        <div className="list-images">
          {banners.map((banner, index) => (
            <div
              key={banner.id || index}
              className={`slide ${index === currentIndex ? 'active' : ''}`}
              style={banner.src
                ? { backgroundImage: `url(${banner.src})` }
                : { background: banner.gradient }
              }
            >
              {!banner.src && (
                <div className="slide-content">
                  <h2 className="slide-title">{banner.title}</h2>
                  <p className="slide-subtitle">{banner.subtitle}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="banner-btn next" onClick={() => changeBanner(1)}>
          &#10095;
        </button>

        {/* Dots */}
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Banner
