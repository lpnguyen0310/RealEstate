export function extractErrorMessage(err, fallback = "Đã có lỗi xảy ra") {
  const r = err?.response;
  return (
    r?.data?.message ||
    r?.data?.error ||
    err?.message ||
    fallback
  );
}