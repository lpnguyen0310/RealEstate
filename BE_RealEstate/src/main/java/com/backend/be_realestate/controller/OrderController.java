package com.backend.be_realestate.controller;

import com.backend.be_realestate.entity.UserEntity;
import com.backend.be_realestate.exceptions.InsufficientBalanceException;
import com.backend.be_realestate.modals.dto.order.OrderDTO;
import com.backend.be_realestate.modals.request.order.CheckoutReq;
import com.backend.be_realestate.repository.UserRepository;
import com.backend.be_realestate.service.OrderService;
import com.backend.be_realestate.modals.response.ApiResponse;
import com.backend.be_realestate.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    // FE gọi để tạo đơn hàng
    @PostMapping("/create")
    public ApiResponse<OrderDTO> create(@RequestBody @Valid CheckoutReq req) {
        return ApiResponse.success(orderService.createOrder(req));
    }

    // FE gọi để lấy chi tiết đơn hàng
    @GetMapping("/{orderId}")
    public ApiResponse<OrderDTO> getOrder(@PathVariable Long orderId) {
        return ApiResponse.success(orderService.getOrderDetail(orderId));
    }

    // FE gọi để lấy danh sách tất cả đơn hàng
    @GetMapping
    public ApiResponse<List<OrderDTO>> getAllOrders() {
        return ApiResponse.success(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<Map<String, Object>>> getMyOrders(Principal principal) {
        String userEmail = principal.getName(); // Chỉ lấy được email/username
        // Phải query DB để lấy ID từ email
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
        Long userId = user.getUserId();

        List<Map<String, Object>> myOrders = orderService.getOrdersByUserId(userId);
        return ApiResponse.success(myOrders);
    }

    @PostMapping("/{orderId}/pay-with-balance")
    public ResponseEntity<?> payOrderWithBalance(@PathVariable Long orderId) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            if (userEmail == null || userEmail.equals("anonymousUser")) {
                // ⭐️ SỬA Ở ĐÂY: Dùng ApiResponse.fail ⭐️
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.fail(HttpStatus.UNAUTHORIZED.value(), "Người dùng chưa đăng nhập", null));
            }
            OrderDTO paidOrderDto = orderService.payWithBalance(orderId, userEmail);
            return ResponseEntity.ok(ApiResponse.success(paidOrderDto));

        } catch (InsufficientBalanceException e) {
            log.warn("Thanh toán bằng số dư thất bại cho orderId={}: {}", orderId, e.getMessage());
            // ⭐️ SỬA Ở ĐÂY: Dùng ApiResponse.fail ⭐️
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null));
        } catch (IllegalArgumentException | UsernameNotFoundException e) {
            log.warn("Lỗi khi thanh toán bằng số dư cho orderId={}: {}", orderId, e.getMessage());
            // ⭐️ SỬA Ở ĐÂY: Dùng ApiResponse.fail ⭐️
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail(HttpStatus.NOT_FOUND.value(), e.getMessage(), null));
        } catch (IllegalStateException e) {
            log.warn("Lỗi trạng thái khi thanh toán bằng số dư cho orderId={}: {}", orderId, e.getMessage());
            // ⭐️ SỬA Ở ĐÂY: Dùng ApiResponse.fail ⭐️
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail(HttpStatus.CONFLICT.value(), e.getMessage(), null));
        } catch (Exception e) {
            log.error("Lỗi không xác định khi thanh toán bằng số dư cho orderId={}", orderId, e);
            // ⭐️ SỬA Ở ĐÂY: Dùng ApiResponse.fail ⭐️
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Lỗi hệ thống không mong muốn khi xử lý thanh toán.", e.getClass().getName())); // Có thể thêm tên Exception vào errors
        }
    }
}
