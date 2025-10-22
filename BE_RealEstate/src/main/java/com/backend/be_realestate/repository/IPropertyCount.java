package com.backend.be_realestate.repository;

import com.backend.be_realestate.enums.PropertyStatus;

public interface IPropertyCount {
    PropertyStatus getStatus(); // Phải khớp với tên Enum
    Long getCount();
}
