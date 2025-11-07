package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SavedPropertyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedPropertyRepository extends JpaRepository<SavedPropertyEntity, Long> {

    boolean existsByUserUserIdAndPropertyId(Long userId, Long propertyId);

    void deleteByUserUserIdAndPropertyId(Long userId, Long propertyId);

    @Query("""
           select sp.property.id
           from SavedPropertyEntity sp
           where sp.user.userId = :uid
           order by sp.createdAt desc
           """)
    List<Long> findPropertyIdsByUser(@Param("uid") Long userId);

    // Spring Data cho phép dùng dấu '_' để truy cập thuộc tính lồng: property.id
    List<SavedPropertyEntity> findByProperty_Id(Long propertyId);

    // Top District theo lượt lưu
    @Query("""
           select p.district.id, count(p.id)
           from SavedPropertyEntity sp
           join sp.property p
           where sp.user.userId = :uid and p.district.id is not null
           group by p.district.id
           order by count(p.id) desc
           """)
    List<Object[]> topDistrictIds(@Param("uid") Long userId);


    @Query("""
           select p.propertyType, count(p.id)
           from SavedPropertyEntity sp
           join sp.property p
           where sp.user.userId = :uid and p.propertyType is not null
           group by p.propertyType
           order by count(p.id) desc
           """)
    List<Object[]> topPropertyTypes(@Param("uid") Long userId);


//    @Query(value = """
//        SELECT
//          COALESCE(AVG(p.price), 0)          AS avgPrice,
//          COALESCE(STDDEV_POP(p.price), 0)   AS stdPrice,
//          COALESCE(AVG(p.area), 0)           AS avgArea,
//          COALESCE(STDDEV_POP(p.area), 0)    AS stdArea
//        FROM saved_properties sp
//        JOIN properties p ON p.id = sp.property_id
//        WHERE sp.user_id = :userId
//          AND p.status = 'PUBLISHED'
//          AND p.price IS NOT NULL
//          AND p.area  IS NOT NULL
//        """, nativeQuery = true)
//    List<Object[]> priceAreaStats(@Param("userId") Long userId);

    @Query(value = """
        SELECT
          COALESCE(MIN(p.price), 0)  AS minPrice,
          COALESCE(MAX(p.price), 0)  AS maxPrice,
          COALESCE(MIN(p.area), 0)   AS minArea,
          COALESCE(MAX(p.area), 0)   AS maxArea
        FROM saved_properties sp
        JOIN properties p ON p.id = sp.property_id
        WHERE sp.user_id = :userId
          AND p.status = 'PUBLISHED'
          AND p.price IS NOT NULL
          AND p.area  IS NOT NULL
        """, nativeQuery = true)
    List<Object[]> priceAreaMinMax(@Param("userId") Long userId);

    @Query("""
       select p.city.id, count(p.id)
       from SavedPropertyEntity sp
       join sp.property p
       where sp.user.userId = :uid and p.city.id is not null
       group by p.city.id
       order by count(p.id) desc
       """)
    List<Object[]> topCityIds(@Param("uid") Long userId);
}
