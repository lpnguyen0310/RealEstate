package com.backend.be_realestate.repository;

import com.backend.be_realestate.entity.CityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CityRepository extends JpaRepository<CityEntity,Long> {
    @Query(value = """
      SELECT c2.*
      FROM cities c1
      JOIN cities c2 ON c2.id <> c1.id
      WHERE c1.id = :cityId
        AND c2.lat IS NOT NULL AND c2.lng IS NOT NULL
      ORDER BY (
        6371 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS((c2.lat - c1.lat)/2)), 2) +
            COS(RADIANS(c1.lat)) * COS(RADIANS(c2.lat)) *
            POWER(SIN(RADIANS((c2.lng - c1.lng)/2)), 2)
          )
        )
      ) ASC
      LIMIT :limit
    """, nativeQuery = true)
    List<CityEntity> findNearestCities(@Param("cityId") Long cityId, @Param("limit") int limit);

    @Query("""
      select c from CityEntity c
      where c.id in :ids and c.lat is not null and c.lng is not null
    """)
    List<CityEntity> findAllWithLatLngByIdIn(@Param("ids") List<Long> ids);
}
