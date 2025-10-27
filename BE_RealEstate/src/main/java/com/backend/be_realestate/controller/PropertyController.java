package com.backend.be_realestate.controller;

import com.backend.be_realestate.modals.dto.PropertyCardDTO;

import com.backend.be_realestate.modals.dto.PropertyDTO;
import com.backend.be_realestate.modals.dto.PropertyDetailDTO;
import com.backend.be_realestate.modals.dto.UserFavoriteDTO;
import com.backend.be_realestate.modals.request.CreatePropertyRequest;
import com.backend.be_realestate.modals.response.CreatePropertyResponse;
import com.backend.be_realestate.modals.response.PageResponse;
import com.backend.be_realestate.service.IPropertyService;
import com.backend.be_realestate.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final IPropertyService propertyService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<Page<PropertyCardDTO>> searchProperties(
            @RequestParam Map<String, String> allParams
    ) {
        Page<PropertyCardDTO> propertyPage = propertyService.searchProperties(allParams);
        return ResponseEntity.ok(propertyPage);
    }

//    @GetMapping("/{id}")
//    public ResponseEntity<PropertyDetailDTO> getPropertyById(@PathVariable Long id) {
//        PropertyDetailDTO propertyDetail = propertyService.getPropertyDetailById(id);
//        return ResponseEntity.ok(propertyDetail);
//    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyDetailDTO> getPropertyById(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam(name = "preview", defaultValue = "false") boolean preview
    ) {
        Long userId = securityUtils.currentUserId(auth); // null nếu chưa đăng nhập
        PropertyDetailDTO dto = propertyService.getPropertyDetailById(id, userId, preview);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<PropertyDTO>> getMyProperties(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "postedAt,desc") String sort,
            @RequestParam(required = false) String status // <-- THÊM THAM SỐ NÀY
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        String[] s = sort.split(",");
        var dir = (s.length>1 && s[1].equalsIgnoreCase("asc")) ? Sort.Direction.ASC : Sort.Direction.DESC;
        var pageable = PageRequest.of(page, size, Sort.by(dir, s[0]));

        // === GỌI HÀM SERVICE MỚI ===
        // Truyền 'status' (có thể là null) vào service
        var pageDto = propertyService.getPropertiesByUser(userId, status, pageable);

        return ResponseEntity.ok(PageResponse.from(pageDto));
    }


    @PostMapping("create")
    public ResponseEntity<CreatePropertyResponse> create(
            Authentication authentication,
            @RequestBody CreatePropertyRequest req
    ) {
        Long userId = securityUtils.currentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var res = propertyService.create(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/my-counts")
    public ResponseEntity<Map<String, Long>> getMyPropertyCounts(Authentication auth) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        Map<String, Long> counts = propertyService.getPropertyCountsByStatus(userId);
        return ResponseEntity.ok(counts);
    }


    @GetMapping("/recommendations")
    public ResponseEntity<List<PropertyCardDTO>> recommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(propertyService.getRecommendations(userId, limit));
    }
    @GetMapping("/{id}/favorites")
    public ResponseEntity<List<UserFavoriteDTO>> getPropertyFavorites( // Sửa ResponseEntity<?>
                                                                       @PathVariable Long id,
                                                                       Authentication auth
    ) {
        Long userId = securityUtils.currentUserId(auth);
        if (userId == null) return ResponseEntity.status(401).build();

        List<UserFavoriteDTO> users = propertyService.getUsersWhoFavorited(id, userId);
        return ResponseEntity.ok(users);
    }

}