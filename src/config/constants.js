export const AUTH = {
  ACCESS_TOKEN_EXPIRES: "15d",
  REFRESH_TOKEN_EXPIRES: "7d",
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export const ERROR_MESSAGES = {
  AUTH: {
    TOKEN_EXPIRED: "Your session has expired. Please login again.",
    TOKEN_INVALID: "Invalid authentication token.",
    TOKEN_MISSING: "Authentication token is missing.",
    UNAUTHORIZED: "Not authorized to access this resource.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    EMAIL_EXISTS: "User with this email already exists.",
    NIP_EXISTS: "User with this NIP already exists.",
    USER_NOT_FOUND: "User not found.",
    REFRESH_TOKEN_REQUIRED: "Refresh token is required.",
    REFRESH_TOKEN_INVALID: "Invalid refresh token.",
  },
  VALIDATION: {
    INVALID_EMAIL: "Please provide a valid email address.",
    PASSWORD_MIN: "Password must be at least 6 characters.",
    NAME_MIN: "Name must be at least 2 characters.",
    NIP_MIN: "NIP must be at least 5 characters.",
  },
};

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    REGISTER_SUCCESS: "Registration successful",
    LOGOUT_SUCCESS: "Logged out successfully",
    TOKEN_REFRESHED: "Token refreshed successfully",
    PROFILE_RETRIEVED: "User profile retrieved successfully",
  },
};
