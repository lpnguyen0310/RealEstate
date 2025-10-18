package com.backend.be_realestate.exceptions;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT) // 409
public class OutOfStockException extends RuntimeException {
    public OutOfStockException(String type) {
        super("Out of stock for " + type);
    }
}