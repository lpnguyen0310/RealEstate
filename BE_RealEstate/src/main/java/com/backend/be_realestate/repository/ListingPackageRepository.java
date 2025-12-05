package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.ListingPackage;
import com.backend.be_realestate.enums.OrderStatus;
import com.backend.be_realestate.modals.dto.packageEstate.PackageSalesStatsDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ListingPackageRepository extends JpaRepository<ListingPackage, Long> {
    List<ListingPackage> findAllByIsActiveTrueOrderBySortOrderAscIdAsc();
    Optional<ListingPackage> findByCode(String code);
    boolean existsByCode(String code);
    @Query("SELECT p FROM ListingPackage p LEFT JOIN FETCH p.items WHERE p.isActive = :active ORDER BY p.sortOrder ASC, p.id ASC")
    List<ListingPackage> findAllActiveWithItems(@Param("active") boolean active);
    @Query("SELECT p FROM ListingPackage p LEFT JOIN FETCH p.items ORDER BY p.sortOrder ASC, p.id ASC")
    List<ListingPackage> findAllWithItems();


    @Query("""
        select new com.backend.be_realestate.modals.dto.packageEstate.PackageSalesStatsDTO(
            p.id,
            p.code,
            p.name,
            p.packageType,
            count(oi.id),
            coalesce(sum(oi.lineTotal), 0)
        )
        from ListingPackage p
        left join OrderItemEntity oi
               on oi.productId = p.id
              and oi.order.status in :statuses
        where p.isActive = true
        group by p.id, p.code, p.name, p.packageType
        order by p.sortOrder asc
        """)
    List<PackageSalesStatsDTO> findPackageSalesStats(
            @Param("statuses") List<OrderStatus> statuses
    );
}
