package com.backend.be_realestate.controller.admin;

import com.backend.be_realestate.modals.response.admin.NewUsersKpiResponse;
import com.backend.be_realestate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/kpi")
@RequiredArgsConstructor
public class AdminKpiController {

    private final UserService userService;

    @GetMapping("/new-users")
    public ResponseEntity<NewUsersKpiResponse> newUsers(
            @RequestParam(name = "range", defaultValue = "last_30d") String range) {
        return ResponseEntity.ok(userService.newUsersKpi(range));
    }
}