package com.backend.be_realestate.modals;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GoogleProfile {
    String email;
    String sub;       // Google user id
    String givenName; // optional
    String familyName;// optional
    String picture;   // optional
}