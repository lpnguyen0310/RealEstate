// @ts-nocheck  // (tùy chọn) nếu project đang bật checkJs

// ánh xạ code API -> id mock để lấy field phụ
const CODE_TO_MOCK_ID = {
  STD_1: "basic",
  VIP_1: "vip",
  PRM_1: "prem",
  COMBO_EXP: "c1",
  COMBO_FAST: "c2",
  COMBO_LEAD: "c3",
};

const toMap = (arr = []) => {
  const m = new Map();
  arr.forEach((x) => x && x.id && m.set(x.id, x));
  return m;
};

const buildComboSub = (items = []) =>
  items.map((it) => `${it.quantity} tin ${it.listingType === "VIP" ? "VIP" : "Premium"}`).join(", ");

function codeToMockIdInv(mockId) {
  const entry = Object.entries(CODE_TO_MOCK_ID).find(([, v]) => v === mockId);
  return entry ? entry[0] : mockId;
}

export function normalizeAndMerge(api = [], mockSingles = [], mockCombos = []) {
  const mockSinglesMap = toMap(mockSingles);
  const mockCombosMap = toMap(mockCombos);

  const singles = [];
  const combos = [];

  api
    .slice()
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0))
    .forEach((p) => {
      const mockId = CODE_TO_MOCK_ID[p.code];
      const baseApi = {
        id: p.code, // dùng code làm key hiển thị/giỏ
        title: p.name,
        price: p.price,
        sortOrder: p.sortOrder ?? undefined,
        _raw: p,
      };

      if (p.packageType === "SINGLE") {
        const mock = mockId ? mockSinglesMap.get(mockId) : undefined;
        const apiSuggest = {
          desc: p.boostFactor ? `Trên tin thường, x${p.boostFactor} lượt xem` : undefined,
          note: p.price === 0 ? "Miễn phí" : undefined,
          tag: p.boostFactor ? "Hiệu suất" : undefined,
        };
        singles.push({
          ...(mock || {}),   // mock trước để giữ field phụ
          ...baseApi,        // API ghi đè title/price/sort
          ...(apiSuggest.desc ? { desc: apiSuggest.desc } : {}),
          ...(apiSuggest.note ? { note: apiSuggest.note } : {}),
          ...(apiSuggest.tag ? { tag: apiSuggest.tag } : {}),
        });
      } else {
        const mock = mockId ? mockCombosMap.get(mockId) : undefined;
        const apiExtras = {
          sub: buildComboSub(p.items || []),
          items: p.items || [],
        };
        combos.push({
          ...(mock || {}), // sub/old/save/chip nếu mock có
          ...baseApi,
          ...apiExtras,    // sub từ API nếu mock không có
        });
      }
    });

  // Bù nếu API thiếu món có trong mock
  mockSingles.forEach((ms) => {
    const exists = singles.some(
      (s) => s.title === ms.title || s.id === codeToMockIdInv(ms.id)
    );
    if (!exists) singles.push(ms);
  });
  mockCombos.forEach((mc) => {
    const exists = combos.some(
      (c) => c.title === mc.title || c.id === codeToMockIdInv(mc.id)
    );
    if (!exists) combos.push(mc);
  });

  const ALL_ITEMS = [...singles, ...combos];
  return { SINGLE: singles, COMBOS: combos, ALL_ITEMS };
}
