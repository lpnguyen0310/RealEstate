export function redirectAfterLogin({ roles = [], navigate, location }) {
    const from = location.state?.from;
    if (from) {
        navigate(from, { replace: true });
        return;
    }
    if (roles.includes("ADMIN")) {
        navigate("/admin", { replace: true });
    } else {
        navigate("/", { replace: true }); // Home; user tự bấm "Tổng quan" mới vào /dashboard
    }
}