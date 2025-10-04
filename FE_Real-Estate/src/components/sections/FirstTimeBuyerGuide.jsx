import { FIRST_TIME_GUIDE } from "../../data/GuildData";

function GuideCard({ item }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 hover:shadow-md transition-shadow">
      {/* Icon + Bước */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[22px]"
          style={{ backgroundColor: item.iconBg }}
          aria-hidden
        >
          <span>{item.icon}</span>
        </div>
        <span className="text-gray-500 text-sm">Bước {item.step}</span>
      </div>

      {/* Title */}
      <h3 className="text-[18px] font-semibold text-gray-900 mb-3">
        {item.title}
      </h3>

      {/* Bullets */}
      <ul className="space-y-2 mb-4">
        {item.points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-[15px] text-gray-700">
            <span className="mt-[6px] inline-block w-1.5 h-1.5 rounded-full bg-[#1f5fbf]" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between text-[14px]">
        <span className="text-gray-500">{item.count} bài viết</span>
        <a
          href={item.href}
          className="text-[#1f5fbf] font-semibold hover:underline"
        >
          Khám phá
        </a>
      </div>
    </article>
  );
}

export default function FirstTimeBuyerGuide() {
  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-[1440px]">
        <header className="mb-6 lg:mb-8">
          <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#1b2a57]">
            Cẩm nang mua nhà lần đầu
          </h2>
        </header>

        {/* Grid: 1 cột mobile, 2 cột md, 3 cột lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FIRST_TIME_GUIDE.map((item) => (
            <GuideCard key={item.step} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
