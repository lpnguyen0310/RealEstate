package com.backend.be_realestate.modals.scoreVerify;

import java.util.List;
import java.util.Map;

public class VerifyAiRequest {
    public Map<String, Object> facts;     // dữ liệu từ PostDetailDrawer
    public Documents documents;

    public static class Documents {
        public List<String> deed;          // URLs ảnh/pdf sổ đỏ
        public List<String> authorization; // URLs ảnh/pdf ủy quyền
    }
}