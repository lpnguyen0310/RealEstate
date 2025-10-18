package com.backend.be_realestate.entity;

import com.backend.be_realestate.enums.ItemType;
import com.backend.be_realestate.enums.ListingType;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "order_items",
        indexes = {
                @Index(name = "idx_order_items_order", columnList = "order_id")
        }
)
public class OrderItemEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cha: Order
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_items_order"))
    private OrderEntity order;

    // Tham chiếu catalog: ListingPackage
    @Column(name = "product_id", nullable = false)
    private Long productId;                // ListingPackage.id

    @Column(name = "product_code", length = 100)
    private String productCode;            // VD: VIP_SINGLE, COMBO_EXP

    @Column(name = "title", length = 200, nullable = false)
    private String title;                  // đóng dấu tên tại thời điểm mua

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20, nullable = false)
    private ItemType itemType;             // SINGLE | COMBO

    @Enumerated(EnumType.STRING)
    @Column(name = "listing_type", length = 20)
    private ListingType listingType;       // chỉ set nếu SINGLE (NORMAL|VIP|PREMIUM)

    // Giá đóng dấu tại thời điểm mua (đơn vị: VND)
    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Column(name = "qty", nullable = false)
    private Integer qty;                   // >= 1

    @Column(name = "line_total", nullable = false)
    private Long lineTotal;                // unit_price * qty
}
