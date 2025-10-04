// src/components/sections/ExploreAmenities.jsx
export default function ExploreAmenities() {
  return (
    <section className="mt-12">
      <div
        className="
          relative overflow-hidden rounded-3xl shadow-lg
          bg-[url('/src/assets/home-section4-image-bg.png')] 
          bg-cover bg-center
          min-h-[280px]
        "
      >
        {/* lớp phủ nhẹ để chữ nổi hơn */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

        {/* Card nội dung bên phải */}
        <div className="relative max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-10">
          <div className="md:ml-auto md:w-[560px]">
            <div className="
              bg-white/90 backdrop-blur-md rounded-3xl shadow-xl
              border border-white/60
              p-6 md:p-8
            ">
              <h3 className="text-[22px] md:text-[26px] font-extrabold text-[#1b2a57]">
                Khám phá tiện ích
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed">
                Tìm địa điểm sống lý tưởng của bạn với <b>Region Discovery™</b>:
                phân tích nâng cao về môi trường sống, ngập lụt, mật độ xây dựng,
                phát triển giao thông… từ dữ liệu vệ tinh.
              </p>

              <a
                href="/tien-ich-xung-quanh"
                className="
                  inline-flex items-center justify-center
                  mt-5 h-11 px-5 rounded-xl
                  bg-[#1f4fbf] hover:bg-[#173fa2]
                  text-white font-semibold shadow
                "
              >
                Khám phá ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
