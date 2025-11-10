package com.backend.be_realestate.service.impl;

import com.backend.be_realestate.entity.PotentialCustomer;
import com.backend.be_realestate.entity.PropertyActivityLog;
import com.backend.be_realestate.entity.PropertyEntity;
import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.enums.ActivityType;
import com.backend.be_realestate.enums.CustomerLeadType;
import com.backend.be_realestate.enums.PropertyType;
import com.backend.be_realestate.exceptions.NotFoundException;
import com.backend.be_realestate.modals.dto.PotentialCustomerDTO;
import com.backend.be_realestate.modals.request.CreateLeadFormRequest;
import com.backend.be_realestate.repository.PotentialCustomerRepository;
import com.backend.be_realestate.repository.PropertyActivityLogRepository;
import com.backend.be_realestate.repository.PropertyRepository;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.IPropertyTrackingService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyTrackingServiceImpl implements IPropertyTrackingService {

    private final PropertyRepository propertyRepository;
    private final PropertyActivityLogRepository activityLogRepository;
    private final PotentialCustomerRepository potentialCustomerRepository;
    private final UserRepository userRepository;

    // Định nghĩa thời gian lọc trùng lặp
    private static final int VIEW_DEDUPLICATION_HOURS = 1;
    private static final int INTERACTION_DEDUPLICATION_MINUTES = 30;
    private static final int LEAD_DEDUPLICATION_HOURS = 24;

    @Override
    @Transactional
    public void logView(Long propertyId, Long currentUserId, String ipAddress, String userAgent) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));

        // Không tính lượt xem của chính chủ
        if (currentUserId != null && property.getUser().getUserId().equals(currentUserId)) {
            return;
        }

        Timestamp threshold = Timestamp.from(Instant.now().minus(VIEW_DEDUPLICATION_HOURS, ChronoUnit.HOURS));
        boolean hasViewed;

        if (currentUserId != null) {
            hasViewed = activityLogRepository.existsByPropertyIdAndUserUserIdAndActivityTypeAndCreatedAtAfter(
                    propertyId, currentUserId, ActivityType.VIEW, threshold);
        } else {
            hasViewed = activityLogRepository.existsByPropertyIdAndIpAddressAndActivityTypeAndCreatedAtAfter(
                    propertyId, ipAddress, ActivityType.VIEW, threshold);
        }

        if (!hasViewed) {
            // 1. Ghi log
            UserEntity user = (currentUserId != null) ? userRepository.getReferenceById(currentUserId) : null;
            PropertyActivityLog log = PropertyActivityLog.builder()
                    .property(property)
                    .user(user)
                    .activityType(ActivityType.VIEW)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            activityLogRepository.save(log);

            // 2. Cập nhật cache count trên tin đăng
            property.setViewCount(property.getViewCount() + 1);
            propertyRepository.save(property);
        }
    }

    @Override
    @Transactional
    public void logInteraction(Long propertyId, ActivityType type, Long currentUserId, String ipAddress, String userAgent) {

        // === LOGIC MỚI: TÁCH BIỆT LEAD VÀ INTERACTION ===

        if (type == ActivityType.ZALO_CLICK) {
            // ZALO_CLICK giờ được coi là LEAD
            createLead(propertyId, currentUserId, ipAddress, CustomerLeadType.ZALO_CLICK);

        } else if (type == ActivityType.SHARE || type == ActivityType.FAVORITE) {
            // SHARE và FAVORITE được coi là INTERACTION (sự kiện)

            PropertyEntity property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new NotFoundException("Property not found"));

            Timestamp threshold = Timestamp.from(Instant.now().minus(INTERACTION_DEDUPLICATION_MINUTES, ChronoUnit.MINUTES));
            boolean hasInteracted;

            if (currentUserId != null) {
                hasInteracted = activityLogRepository.existsByPropertyIdAndUserUserIdAndActivityTypeAndCreatedAtAfter(
                        propertyId, currentUserId, type, threshold);
            } else {
                hasInteracted = activityLogRepository.existsByPropertyIdAndIpAddressAndActivityTypeAndCreatedAtAfter(
                        propertyId, ipAddress, type, threshold);
            }

            if (!hasInteracted) {
                UserEntity user = (currentUserId != null) ? userRepository.getReferenceById(currentUserId) : null;
                PropertyActivityLog log = PropertyActivityLog.builder()
                        .property(property)
                        .user(user)
                        .activityType(type) // Sẽ là SHARE hoặc FAVORITE
                        .ipAddress(ipAddress)
                        .userAgent(userAgent)
                        .build();
                activityLogRepository.save(log);
            }
        }
    }

    @Override
    @Transactional
    public void createLeadFromViewPhone(Long propertyId, Long currentUserId, String ipAddress) {
        // Gọi hàm helper private
        createLead(propertyId, currentUserId, ipAddress, CustomerLeadType.VIEW_PHONE);
    }

    @Override
    @Transactional
    public void createLeadFromForm(Long propertyId, CreateLeadFormRequest formRequest, Long currentUserId, String ipAddress) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));

        UserEntity leadUser = (currentUserId != null) ? userRepository.getReferenceById(currentUserId) : null;

        PotentialCustomer lead = PotentialCustomer.builder()
                .property(property)
                .propertyOwner(property.getUser())
                .leadUser(leadUser)
                .leadType(CustomerLeadType.CONTACT_FORM)
                .ipAddress(ipAddress)
                .leadName(formRequest.getName())
                .leadPhone(formRequest.getPhone())
                .leadEmail(formRequest.getEmail())
                .message(formRequest.getMessage())
                .build();

        potentialCustomerRepository.save(lead);
        // (Bạn có thể thêm logic gửi thông báo/email cho chủ tin đăng ở đây)
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PotentialCustomerDTO> getMyLeads(Long propertyOwnerUserId, String propertyType, Pageable pageable) {

        // 1. Chuyển đổi String "sell" hoặc "rent" thành Enum
        PropertyType typeEnum;
        try {
            typeEnum = PropertyType.valueOf(propertyType);
        } catch (Exception e) {
            throw new IllegalArgumentException("Loại tin đăng không hợp lệ: " + propertyType);
        }

        // 2. Gọi thẳng hàm Repository (đơn giản hơn rất nhiều)
        Page<PotentialCustomer> leadsPage = potentialCustomerRepository.findMyLeads(
                propertyOwnerUserId,
                typeEnum,
                pageable
        );

        // 3. Chuyển đổi Page<Entity> thành Page<DTO> (giữ nguyên)
        return leadsPage.map(PotentialCustomerDTO::new); // Dùng constructor của DTO
    }

    @Override
    @Transactional
    public void deleteLead(Long leadId, Long ownerUserId) {
        // 1. Tìm lead
        PotentialCustomer lead = potentialCustomerRepository.findById(leadId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khách hàng tiềm năng này."));

        // 2. *** KIỂM TRA QUYỀN SỞ HỮU (RẤT QUAN TRỌNG) ***
        // Đảm bảo rằng người đang yêu cầu xóa (ownerUserId)
        // chính là chủ sở hữu của tin đăng (propertyOwner)
        if (lead.getPropertyOwner() == null ||
                !lead.getPropertyOwner().getUserId().equals(ownerUserId)) {

            // Nếu không đúng, ném lỗi AccessDenied
            throw new AccessDeniedException("Bạn không có quyền xóa khách hàng này.");
        }

        // 3. Nếu đúng, thực hiện xóa
        potentialCustomerRepository.delete(lead);
    }

    // === HÀM HELPER MỚI ĐỂ TÁI SỬ DỤNG LOGIC TẠO LEAD ===
    private void createLead(Long propertyId, Long currentUserId, String ipAddress, CustomerLeadType leadType) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));

        if (currentUserId != null && property.getUser().getUserId().equals(currentUserId)) {
            return;
        }

        Timestamp threshold = Timestamp.from(Instant.now().minus(LEAD_DEDUPLICATION_HOURS, ChronoUnit.HOURS));
        boolean hasCreatedLead;

        if (currentUserId != null) {
            hasCreatedLead = potentialCustomerRepository.existsByPropertyIdAndLeadUserUserIdAndLeadTypeAndCreatedAtAfter(
                    propertyId, currentUserId, leadType, threshold);
        } else {
            hasCreatedLead = potentialCustomerRepository.existsByPropertyIdAndIpAddressAndLeadTypeAndCreatedAtAfter(
                    propertyId, ipAddress, leadType, threshold);
        }

        if (!hasCreatedLead) {
            // SỬA: Dùng findById thay vì getReferenceById để lấy đầy đủ thông tin User
            UserEntity leadUser = (currentUserId != null) ? userRepository.findById(currentUserId).orElse(null) : null;

            // Dùng Builder để dễ đọc hơn
            PotentialCustomer.PotentialCustomerBuilder leadBuilder = PotentialCustomer.builder()
                    .property(property)
                    .propertyOwner(property.getUser())
                    .leadUser(leadUser)
                    .leadType(leadType)
                    .ipAddress(ipAddress);

            // === LOGIC MỚI: SAO CHÉP THÔNG TIN NẾU USER TỒN TẠI ===
            if (leadUser != null) {
                leadBuilder.leadName((leadUser.getFirstName() + " " + leadUser.getLastName()).trim());
                leadBuilder.leadPhone(leadUser.getPhone());
                leadBuilder.leadEmail(leadUser.getEmail());
            }
            // === KẾT THÚC SỬA ĐỔI ===

            potentialCustomerRepository.save(leadBuilder.build());
        }
    }
}