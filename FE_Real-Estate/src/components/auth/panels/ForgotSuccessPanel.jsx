import { CheckCircleTwoTone } from "@ant-design/icons";

export default function ForgotSuccessPanel({ sentTo, onBackToLogin }) {
    return (
        <div className="text-center px-6">
            <CheckCircleTwoTone twoToneColor="#36b37e" className="text-[56px]" />
            <h3 className="mt-4 text-[18px] font-semibold text-gray-900">Gửi thành công</h3>
            <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">
                Đường dẫn khôi phục mật khẩu đã được gửi
                {sentTo ? ` đến ${sentTo}` : ""}. Vui lòng kiểm tra và làm theo hướng dẫn.
            </p>
            <div className="pt-6">
                <button type="button" onClick={onBackToLogin}
                    className="text-[#d6402c] font-semibold hover:text-[#c13628]">
                    Đăng nhập tại đây
                </button>
            </div>
        </div>
    );
}
