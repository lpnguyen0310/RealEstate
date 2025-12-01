import { useState } from "react";
import { Modal, Rate, Input, Button, message } from "antd";

const { TextArea } = Input;

export default function PostRatingModal({
    open,
    onClose,
    onSubmit = async () => { },
    postId,
}) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("form"); // "form" | "thankyou"

    const resetState = () => {
        setRating(0);
        setComment("");
        setLoading(false);
        setStep("form");
    };

    const handleOk = async () => {
        if (!rating) return;
        try {
            setLoading(true);
            await onSubmit({ rating, comment, postId });
            setLoading(false);

            // Hiện màn cảm ơn trong modal
            setStep("thankyou");
            message.success("Cảm ơn bạn đã đánh giá trải nghiệm!");
        } catch (e) {
            console.error("Submit rating error:", e);
            setLoading(false);
            message.error("Gửi đánh giá thất bại, vui lòng thử lại.");
        }
    };

    const handleClose = () => {
        if (loading) return;
        resetState();
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={560}
            centered
            closable
            title={null}
            destroyOnClose
            bodyStyle={{ padding: 0, background: "transparent" }}
            wrapClassName="rating-modal-wrapper"
        >
            <div className="relative overflow-hidden rounded-2xl bg-white px-8 pt-7 pb-6 shadow-[0_18px_45px_rgba(15,23,42,0.15)]">
                {/* dải gradient trên đầu */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />

                {step === "form" ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-5">
                            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[12px] font-medium text-sky-600 mb-3">
                                <span className="text-[14px]">⭐</span>
                                <span>Đánh giá trải nghiệm</span>
                            </div>

                            <h2 className="text-[20px] font-semibold text-slate-900">
                                Bạn đánh giá trải nghiệm trên trang như thế nào?
                            </h2>
                            <p className="mt-1 text-[14px] text-slate-500">
                                Giúp chúng tôi cải thiện việc đăng và quản lý tin của bạn tốt hơn.
                            </p>
                        </div>

                        {/* Rate */}
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <Rate value={rating} onChange={setRating} style={{ fontSize: 32 }} />
                            <p className="text-[13px] text-slate-500">
                                {rating === 0 && "Chọn số sao để đánh giá"}
                                {rating === 1 && "Rất tệ 😢"}
                                {rating === 2 && "Chưa hài lòng lắm 😕"}
                                {rating === 3 && "Tạm ổn 🙂"}
                                {rating === 4 && "Hài lòng 😄"}
                                {rating === 5 && "Tuyệt vời! 🥰"}
                            </p>
                        </div>

                        {/* Comment */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[14px] text-slate-700">
                                    Góp ý thêm{" "}
                                    <span className="text-slate-400">(không bắt buộc)</span>
                                </div>
                                <span className="text-[12px] text-slate-400">
                                    {comment.length}/300
                                </span>
                            </div>

                            <TextArea
                                rows={4}
                                maxLength={300}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Bạn thích điều gì / chưa hài lòng điểm nào? Hãy chia sẻ để chúng tôi cải thiện trải nghiệm cho bạn nhé…"
                                className="!text-[14px] !rounded-xl !border-slate-200 !bg-slate-50/60 hover:!border-slate-300 focus:!border-[#1677ff] focus:!bg-white focus:!shadow-[0_0_0_2px_rgba(22,119,255,0.15)]"
                            />
                        </div>

                        {/* Footer buttons */}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2">
                            <Button
                                onClick={handleClose}
                                disabled={loading}
                                className="h-10 px-5 rounded-lg !border-slate-200 !text-slate-600 hover:!border-slate-300 hover:!text-slate-800 bg-white"
                            >
                                Để sau
                            </Button>

                            <Button
                                type="primary"
                                onClick={handleOk}
                                loading={loading}
                                disabled={!rating}
                                className="h-10 px-6 rounded-lg font-medium
                  !bg-[#1677ff] !border-[#1677ff]
                  hover:!bg-[#1453d1] hover:!border-[#1453d1]
                  disabled:!bg-[#c7d7ff] disabled:!border-[#c7d7ff]
                  disabled:!text-white"
                            >
                                Gửi đánh giá
                            </Button>
                        </div>
                    </>
                ) : (
                    // ====== MÀN HÌNH CẢM ƠN SAU KHI GỬI ======
                    <div className="py-4 flex flex-col items-center text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                            <span className="text-[26px]">🎉</span>
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-900 mb-1">
                            Xin cảm ơn bạn đã gửi đánh giá!
                        </h2>
                        <p className="text-[14px] text-slate-500 max-w-[360px] mb-5">
                            Đánh giá của bạn sẽ giúp chúng tôi cải thiện trải nghiệm đăng và
                            quản lý tin ngày một tốt hơn.
                        </p>

                        <Button
                            type="primary"
                            onClick={handleClose}
                            className="h-10 px-6 rounded-lg font-medium
                !bg-[#1677ff] !border-[#1677ff]
                hover:!bg-[#1453d1] hover:!border-[#1453d1]"
                        >
                            Đóng
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
