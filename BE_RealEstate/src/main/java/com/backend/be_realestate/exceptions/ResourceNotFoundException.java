package com.backend.be_realestate.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception này sẽ được ném ra khi không tìm thấy một tài nguyên.
 * Annotation @ResponseStatus sẽ tự động khiến Spring Boot trả về
 * HTTP status 404 (NOT_FOUND) khi exception này được ném ra từ một controller.
 */
@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
