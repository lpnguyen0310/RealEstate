// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="w-full bg-[#f3f4f6] border-t border-gray-200">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* ===== 4 CỘT THẲNG HÀNG (mỗi cột là 1 khối dọc) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1.2fr_1.5fr_2fr] gap-x-12 gap-y-10 items-start">
          {/* CỘT 1: Logo + Company + Address + Tel */}
          <div className="space-y-5 text-left">
            <a href="#" className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white font-bold">B</span>
              <div className="leading-tight">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-gray-800">Nexus5-land</span>
                  <span className="text-sm text-gray-600 align-top">.com.vn</span>
                </div>
                <div className="text-xs text-gray-500 -mt-0.5">by PropertyGuru</div>
              </div>
            </a>

            <ColTitle>CÔNG TY CỔ PHẦN PROPERTYGURU VIỆT NAM</ColTitle>
            <Row icon={<IconPin className="h-5 w-5 text-gray-600 mt-[2px]" />}>
              Tầng 31, Keangnam Hanoi Landmark Tower, Phường Yên Hòa, Thành phố Hà Nội, Việt Nam
            </Row>
            <Row icon={<IconPhone className="h-5 w-5 text-gray-600 mt-[2px]" />}>
              (024) 3562 5939 – (024) 3562 5940
            </Row>
          </div>

          {/* CỘT 2: Hotline + Hướng dẫn */}
          <div className="space-y-5 text-left">
            <InfoSmall
              icon={<IconPhone className="h-6 w-6 text-gray-700" />}
              label="Hotline"
              value="1900 1881"
            />
            <ColTitle>HƯỚNG DẪN</ColTitle>
            <ColList items={['Về chúng tôi', 'Báo giá và hỗ trợ', 'Câu hỏi thường gặp', 'Góp ý báo lỗi', 'Sitemap']} />
          </div>

          {/* CỘT 3: Hỗ trợ KH + Quy định */}
          <div className="space-y-5 text-left">
            <InfoSmall
              icon={<IconUserSupport className="h-6 w-6 text-gray-700" />}
              label="Hỗ trợ khách hàng"
              value={
                <a href="https://trogiup.nexus5-land.com.vn" className="font-semibold hover:text-red-600">
                  trogiup.nexus5-land.com.vn
                </a>
              }
            />
            <ColTitle>QUY ĐỊNH</ColTitle>
            <ColList items={['Quy định đăng tin', 'Quy chế hoạt động', 'Điều khoản thỏa thuận', 'Chính sách bảo mật', 'Giải quyết khiếu nại']} />
          </div>

          {/* CỘT 4: CSKH + Form + Ngôn ngữ */}
          <div className="space-y-5 text-left">
            <InfoSmall
              icon={<IconChat className="h-6 w-6 text-gray-700" />}
              label="Chăm sóc khách hàng"
              value={<a href="mailto:hotro@nexus5-land.com.vn" className="font-semibold hover:text-red-600">hotro@nexus5-land.com.vn</a>}
            />

            <div>
              <ColTitle>ĐĂNG KÝ NHẬN TIN</ColTitle>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="w-full rounded-l-lg border border-gray-300 bg-white px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-red-200"
                />
                <button type="submit" className="rounded-r-lg bg-[#e53935] px-3 py-2 text-white hover:bg-[#d32f2f]" aria-label="Gửi">
                  <IconPaperPlane className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div>
              <ColTitle>QUỐC GIA & NGÔN NGỮ</ColTitle>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <IconGlobe className="h-5 w-5" />
                </span>
                <select
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-9 py-2 text-[14px]"
                  defaultValue="vi"
                >
                  <option value="vi">Việt Nam</option>
                  <option value="sg">Singapore</option>
                  <option value="my">Malaysia</option>
                  <option value="th">Thailand</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <IconChevronDown className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gạch dưới + bản quyền */}
        <div className="mt-6 border-t border-gray-200 pt-5">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Nexus5-land.com.vn — Một sản phẩm của PropertyGuru.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ===== Helpers ===== */
function InfoSmall({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-gray-800">
      {icon}
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
function ColTitle({ children }) {
  return <div className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{children}</div>;
}
function ColList({ items }) {
  return (
    <ul className="space-y-2 text-[14px] text-gray-800">
      {items.map((t) => (
        <li key={t}><a href="#" className="hover:text-red-600">{t}</a></li>
      ))}
    </ul>
  );
}
function Row({ icon, children }) {
  return <div className="flex items-start gap-3 text-[14px] text-gray-800">{icon}<p>{children}</p></div>;
}

/* ===== Icons (line mảnh) ===== */
function IconPhone(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
  <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        d="M3 6c0 8 7 15 15 15 1 0 2-.1 3-.3a2 2 0 0 0 1.2-3.2l-1.7-2a2 2 0 0 0-2-.6l-2 .5a12 12 0 0 1-5.5-5.5l.5-2a2 2 0 0 0-.6-2L8.5 2.8A2 2 0 0 0 5.3 4C5.1 5 5 6 5 6Z"/>
</svg>);}
function IconUserSupport(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
  <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 13.5Z"/>
  <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M3 19.5c2-1.6 4.6-2.5 7.5-2.5s5.5.9 7.5 2.5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2Z"/>
</svg>);}
function IconChat(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
  <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M21 7v8a3 3 0 0 1-3 3H8l-5 3V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z"/>
</svg>);}
function IconPin(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
  <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.3 7-10a7 7 0 1 0-14 0c0 5.7 7 10 7 10Z"/>
  <circle cx="12" cy="11" r="2" strokeWidth="1.6" />
</svg>);}
function IconPaperPlane(props){return(<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
  <path d="M3.4 20.4 22 12 3.4 3.6 3 10l11 2-11 2z"/>
</svg>);}
function IconGlobe(props){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
  <circle cx="12" cy="12" r="9" strokeWidth="1.6"/>
  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeWidth="1.6"/>
</svg>);}
function IconChevronDown(props){return(<svg viewBox="0 0 20 20" fill="currentColor" {...props}>
  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/>
</svg>);}
