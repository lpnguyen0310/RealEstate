package com.backend.be_realestate.modals.dto.transactions;


import lombok.*;

import java.time.Instant;
import java.util.Date;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RecentTransactionDTO {
    private Long    orderItemId; // oi.id
    private Long    orderId;     // o.id
    private Long    userId;      // u.id
    private String  userName;    // concat(lastName, ' ', firstName)
    private String  email;       // u.email
    private String  title;       // oi.title
    private Long    amount;      // oi.lineTotal (VND)  <-- đảm bảo kiểu Long
    private Date createdAt;   // o.createdAt         <-- đảm bảo kiểu Instant
}