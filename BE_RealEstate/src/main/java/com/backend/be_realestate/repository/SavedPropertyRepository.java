package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.SavedPropertyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedPropertyRepository extends JpaRepository<SavedPropertyEntity,Long> {
    boolean existsByUserUserIdAndPropertyId(Long userId, Long propertyId);
    void deleteByUserUserIdAndPropertyId(Long userId, Long propertyId);

    @Query("select sp.property.id from SavedPropertyEntity sp where sp.user.userId = :uid order by sp.createdAt desc")
    List<Long> findPropertyIdsByUser(@Param("uid") Long userId);

    @Query("""
           select p.district.id, count(p.id)
           from SavedPropertyEntity sp
           join sp.property p
           where sp.user.userId = :uid and p.district.id is not null
           group by p.district.id
           order by count(p.id) desc
           """)
    List<Object[]> topDistrictIds(@Param("uid") Long userId);

    // Top PropertyType theo Saved (enum)
    @Query("""
           select p.propertyType, count(p.id)
           from SavedPropertyEntity sp
           join sp.property p
           where sp.user.userId = :uid and p.propertyType is not null
           group by p.propertyType
           order by count(p.id) desc
           """)
    List<Object[]> topPropertyTypes(@Param("uid") Long userId);

    @Query("""
           select avg(p.price), stddev(p.price), avg(p.area), stddev(p.area)
           from SavedPropertyEntity sp
           join sp.property p
           where sp.user.userId = :uid and p.price is not null and p.area is not null
           """)
    Object[] priceAreaStats(@Param("uid") Long userId);
}



