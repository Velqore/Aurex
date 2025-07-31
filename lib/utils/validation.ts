export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export interface PasswordValidation {
  valid: boolean;
  message: string;
  score: number; // 0-5 strength score
}

export function validatePassword(password: string): PasswordValidation {
  const minLength = 8;
  const maxLength = 128;

  if (!password) {
    return {
      valid: false,
      message: "Password is required",
      score: 0,
    };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long`,
      score: 0,
    };
  }

  if (password.length > maxLength) {
    return {
      valid: false,
      message: `Password must be less than ${maxLength} characters`,
      score: 0,
    };
  }

  let score = 0;
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasMinLength: password.length >= minLength,
    hasGoodLength: password.length >= 12,
  };

  // Calculate strength score
  if (checks.hasLowercase) score++;
  if (checks.hasUppercase) score++;
  if (checks.hasNumbers) score++;
  if (checks.hasSpecialChars) score++;
  if (checks.hasGoodLength) score++;

  // Minimum requirements for validity
  const hasMinRequirements =
    checks.hasMinLength &&
    checks.hasLowercase &&
    (checks.hasUppercase || checks.hasNumbers || checks.hasSpecialChars);

  if (!hasMinRequirements) {
    let message = "Password must contain at least: ";
    const missing = [];

    if (!checks.hasLowercase) missing.push("one lowercase letter");
    if (!checks.hasUppercase && !checks.hasNumbers && !checks.hasSpecialChars) {
      missing.push("one uppercase letter, number, or special character");
    }

    return {
      valid: false,
      message: message + missing.join(", "),
      score,
    };
  }

  return {
    valid: true,
    message: "Password is valid",
    score,
  };
}

export function validateUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 30) {
    return false;
  }

  // Allow letters, numbers, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
}

export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Remove any HTML tags and trim whitespace
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .substring(0, 1000); // Limit length
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {},
): { valid: boolean; message: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ],
  } = options;

  if (!file) {
    return { valid: false, message: "No file provided" };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type ${file.type} is not allowed`,
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.js$/i,
    /\.vbs$/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
    return {
      valid: false,
      message: "File type not allowed for security reasons",
    };
  }

  return { valid: true, message: "File is valid" };
}

export function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
