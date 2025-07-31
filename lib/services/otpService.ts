import { apiService } from "./apiService";

export interface OtpResponse {
  success: boolean;
  message: string;
  otpSent?: boolean;
  expiresIn?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  emailVerified?: boolean;
  resetToken?: string;
}

class OtpService {
  // Send OTP for login
  async sendLoginOtp(identifier: string): Promise<OtpResponse> {
    try {
      console.log(
        `🔍 DEBUG: Attempting OTP login for identifier: ${identifier}`,
      );

      const response = await apiService.sendOtp({
        identifier,
        type: "login",
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          otpSent: response.data.otpSent,
          expiresIn: response.data.expiresIn,
        };
      } else {
        return {
          success: false,
          message: response.message || "Failed to send OTP",
          otpSent: false,
        };
      }
    } catch (error) {
      console.error("Error sending login OTP:", error);
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
      };
    }
  }

  // Send OTP for registration
  async sendRegistrationOtp(email: string): Promise<OtpResponse> {
    try {
      const response = await apiService.sendOtp({
        identifier: email,
        type: "register",
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          otpSent: response.data.otpSent,
          expiresIn: response.data.expiresIn,
        };
      } else {
        return {
          success: false,
          message: response.message || "Failed to send verification code",
          otpSent: false,
        };
      }
    } catch (error) {
      console.error("Error sending registration OTP:", error);
      return {
        success: false,
        message: "Failed to send verification code. Please try again.",
      };
    }
  }

  // Verify OTP for login
  async verifyLoginOtp(
    identifier: string,
    otpCode: string,
  ): Promise<VerifyOtpResponse> {
    try {
      const response = await apiService.verifyOtp({
        identifier,
        otpCode,
        type: "login",
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          user: response.data.user,
          token: response.data.token,
        };
      } else {
        return {
          success: false,
          message: response.message || "Invalid or expired verification code",
        };
      }
    } catch (error) {
      console.error("Error verifying login OTP:", error);
      return {
        success: false,
        message: "Verification failed. Please try again.",
      };
    }
  }

  // Verify OTP for registration
  async verifyRegistrationOtp(
    email: string,
    otpCode: string,
  ): Promise<VerifyOtpResponse> {
    try {
      const response = await apiService.verifyOtp({
        identifier: email,
        otpCode,
        type: "register",
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          emailVerified: response.data.emailVerified,
        };
      } else {
        return {
          success: false,
          message: response.message || "Invalid or expired verification code",
        };
      }
    } catch (error) {
      console.error("Error verifying registration OTP:", error);
      return {
        success: false,
        message: "Verification failed. Please try again.",
      };
    }
  }

  // Complete user registration after OTP verification
  async completeRegistration(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "pro" | "enterprise" | "free";
  }): Promise<VerifyOtpResponse> {
    try {
      const response = await apiService.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "free",
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message,
          user: response.data.user,
          token: response.data.token,
        };
      } else {
        return {
          success: false,
          message: response.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Error completing registration:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      };
    }
  }

  // Authenticate with username/password (traditional method)
  async authenticateWithPassword(
    identifier: string,
    password: string,
  ): Promise<VerifyOtpResponse & { requiresOtp?: boolean }> {
    try {
      const response = await apiService.login({
        identifier,
        password,
      });

            if (response.success && response.data && response.data.user) {
        return {
          success: true,
          message: response.message,
          user: response.data.user,
          token: response.data.token,
        };
      } else if (!response.success && response.message && response.message.includes("Two-factor")) {
        // 2FA is required
        return {
          success: false,
          message: response.message,
          requiresOtp: true,
        };
      } else {
        return {
          success: false,
          message: response.message || "Authentication failed",
        };
      }
    } catch (error) {
      console.error("Error authenticating with password:", error);
      return {
        success: false,
        message: "Authentication failed. Please try again.",
      };
    }
  }

  // Resend OTP
  async resendOtp(
    identifier: string,
    type: "login" | "register",
  ): Promise<OtpResponse> {
    if (type === "login") {
      return this.sendLoginOtp(identifier);
    } else {
      return this.sendRegistrationOtp(identifier);
    }
  }

  // Helper methods
  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    const maskedLocal =
      local.length > 2
        ? `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}`
        : `${local[0]}*`;
    return `${maskedLocal}@${domain}`;
  }

  // Send OTP via SMS (future implementation)
  async sendSmsOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      // This would integrate with Twilio, AWS SNS, etc.
      console.log(
        `📱 SMS OTP functionality will be implemented with external service`,
      );
      return false; // Not implemented yet
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }
}

export const otpService = new OtpService();
