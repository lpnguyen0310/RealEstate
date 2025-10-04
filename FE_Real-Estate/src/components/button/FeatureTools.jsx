import { Link } from "react-router-dom";
import { FEATURE_TOOLS } from "@/data/FeatureToolData";

export default function FeatureTools() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[720px] lg:min-w-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {FEATURE_TOOLS.map((t) => (
            <Link
              key={t.key}
              to={t.to}
              className="group bg-white border border-gray-200 rounded-2xl px-4 py-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="h-10 w-10 mb-3">
                <img
                  src={t.icon}
                  alt={t.title}
                  className="h-10 w-10 object-contain"
                  onError={(e) => (e.currentTarget.outerHTML = `<div style="font-size:24px;line-height:40px">🏠</div>`)}
                />
              </div>
              <div className="text-gray-900 font-semibold leading-tight">
                {t.title}
              </div>
              <div className="text-gray-700 -mt-0.5">
                {t.subtitle}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
