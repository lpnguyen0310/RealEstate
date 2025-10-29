// Ví dụ nội dung file InsufficientBalanceException.java
package com.backend.be_realestate.exceptions;

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String message) {
        super(message);
    }
}