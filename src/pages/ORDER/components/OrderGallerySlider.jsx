import React from "react";
import Slider from "react-slick";
import { ChevronRight, ChevronLeft, Image } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const SlickArrow = ({ className, style, onClick, icon }) => (
    <button
        className={className}
        style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(30,64,175,0.7)',
            borderRadius: '50%',
            border: 'none',
            zIndex: 2
        }}
        onClick={onClick}
        type="button"
    >
        {icon}
    </button>
);

const CustomDots = dots => (
    <ul className="flex justify-center gap-2 mt-3">
        {dots.map((dot, idx) => (
            <li key={idx} className="inline-block">
                {React.cloneElement(dot.props.children, {
                    className:
                        "w-3 h-3 rounded-full border-2 border-blue-300 " +
                        (dot.props.className?.includes("slick-active")
                            ? "bg-blue-500"
                            : "bg-white")
                })}
            </li>
        ))}
    </ul>
);

const OrderGallerySlider = ({ photos, isOpen }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 border-t-0 px-6 pt-4 pb-6 rounded-b-3xl shadow-lg relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>
    
    {/* Content */}
    <div className="relative z-10">
      <Slider
      dots={true}
      appendDots={CustomDots}
      infinite={false}
      speed={500}
      slidesToShow={2}
      slidesToScroll={1}
      nextArrow={<SlickArrow icon={<ChevronRight className="w-7 h-7 text-white" />} />}
      prevArrow={<SlickArrow icon={<ChevronLeft className="w-7 h-7 text-white" />} />}
      className="order-item-slider"
      swipeToSlide={true}
      adaptiveHeight={false}
    >
      {photos.map((url, idx) => (
        <div key={idx} className="px-2">
          <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 shadow-md bg-white w-full">
            <img
              src={url}
              alt={`Item ${idx + 1}`}
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ minWidth: 0 }}
            />
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              {idx + 1}
            </span>
            <span className="absolute bottom-2 right-2 bg-white/80 text-blue-700 rounded-full p-1 shadow">
              <Image className="w-4 h-4" />
            </span>
          </div>
        </div>
      ))}
      </Slider>
    </div>
  </div>
);

export default OrderGallerySlider;