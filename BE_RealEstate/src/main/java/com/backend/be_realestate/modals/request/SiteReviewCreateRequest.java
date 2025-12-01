package com.backend.be_realestate.modals.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SiteReviewCreateRequest {

    @Min(1)
    @Max(5)
    private int rating;

    @Size(max = 1000)
    private String comment;
}