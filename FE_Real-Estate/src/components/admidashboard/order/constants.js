// src/components/admidashboard/order/constants.js
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

export const STATUS_COLOR = { /* ... như bạn đang có ... */ };

export const METHOD_BADGE = {
    COD: { Icon: LocalAtmOutlinedIcon, label: "COD" },
    VNPAY: { Icon: CreditCardOutlinedIcon, label: "VNPAY" },
    STRIPE: { Icon: CreditCardOutlinedIcon, label: "Stripe" },
    BANK_QR: { Icon: PaymentsOutlinedIcon, label: "VietQR" },
    ZALOPAY: { Icon: CreditCardOutlinedIcon, label: "ZaloPay" },
};

export const ORDER_ACTIONS_HINT =
    "Chỉ hiển thị các hành động hợp lệ theo trạng thái.";

// ==== NEW: style giống table mẫu ====
export const HOVER_BG = "#f7faff";



export const styles = {
    headCell: { fontWeight: 700, fontSize: 14, color: "#1a3b7c" },
    bodyCell: { fontSize: 14, color: "#2b3a55" },
};
