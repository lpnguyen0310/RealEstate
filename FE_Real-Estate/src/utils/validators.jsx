export const isPhone = (v) =>
  /^(0|\+?\d{1,3})?\d{8,12}$/.test((v || "").replace(/\s|-/g, ""));

export const isEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export const validateEmailOrPhone = (_, value) => {
  if (!value) return Promise.reject("Vui lòng nhập email hoặc số điện thoại");
  return isEmail(value) || isPhone(value)
    ? Promise.resolve()
    : Promise.reject("Định dạng không hợp lệ");
};

export const maskPhone = (raw = "") => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6) return raw;
  return `(+84)${digits.slice(-5, -3)}***${digits.slice(-3)}`;
};
export const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const mask = (s) =>
    s.length <= 2 ? s[0] + "*" : s[0] + "*".repeat(s.length - 2) + s.slice(-1);
  const parts = domain.split(".");
  return `${mask(user)}@${[mask(parts[0] || ""), ...parts.slice(1)].join(".")}`;
};