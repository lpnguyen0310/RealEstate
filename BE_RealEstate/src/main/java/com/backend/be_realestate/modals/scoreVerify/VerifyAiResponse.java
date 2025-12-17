package com.backend.be_realestate.modals.scoreVerify;

import java.util.List;

public class VerifyAiResponse {
    public double overallScore; // 0..1
    public String summary;
    public List<Check> checks;
    public List<String> missing;
    public List<String> flags;

    public static class Check {
        public String field;
        public double score;
        public String expected;
        public String extracted;
        public String evidence;
    }
}