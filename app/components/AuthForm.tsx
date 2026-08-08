"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";
import { otpService } from "../../lib/services/otpService";

interface AuthFormProps {
  onLogin?: () => void;
}

type AuthStep =
  | "login"
  | "register"
  | "otp-verification"
  | "registration-details";
type AuthMethod = "password" | "otp";
const RESEND_COOLDOWN_SECONDS = 60;

export default function AuthForm({ onLogin }: AuthFormProps) {
  const { login, register, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AuthStep>("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [showPassword, setShowPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const [formData, setFormData] = useState({
    identifier: "", // email or username
    password: "",
    confirmPassword: "",
    otpCode: "",
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    role: "free" as "admin" | "pro" | "enterprise" | "free",
    department: "",
  });

  const [otpSentTo, setOtpSentTo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");

  // OTP expiry timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Resend cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      setCanResendOtp(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handlePasswordLogin = async () => {
    if (!formData.identifier || !formData.password) {
      setError("Please enter both email/username and password");
      return;
    }

    setAuthLoading(true);
    try {
      const result = await otpService.authenticateWithPassword(
        formData.identifier,
        formData.password,
      );

                  if (result.success && result.user && result.token) {
        // Direct login successful
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

                console.log('✅ Password Auth state updated:', {
          user: result.user?.username,
          isAuthenticated: true
        });

        setAuthSuccess("Login successful!");

        // Call onLogin immediately
        console.log('🔄 Calling onLogin callback for password');
        onLogin?.();
      } else if (result.requiresOtp || result.message.includes("Two-factor authentication required")) {
        // 2FA OTP was sent
        setOtpSentTo(formData.identifier);
        setCurrentStep("otp-verification");
        setOtpTimer(300); // 5 minutes
        setResendTimer(RESEND_COOLDOWN_SECONDS); // 1 minute
        setCanResendOtp(false);
        setAuthSuccess("OTP sent to your email for two-factor authentication.");
      } else {
        console.log('❌ Password login failed:', result.message);
        setError(result.message);
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!formData.identifier) {
      setError("Please enter your email or username");
      return;
    }

    setAuthLoading(true);
    setError(null);
    setAuthSuccess("");
    
    try {
      const result = await otpService.sendLoginOtp(formData.identifier);

      if (result.success && result.otpSent) {
        // OTP was actually sent
        setOtpSentTo(formData.identifier);
        setCurrentStep("otp-verification");
        setOtpTimer(result.expiresIn || 300);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setCanResendOtp(false);
        setAuthSuccess(result.message);
      } else if (result.success && !result.otpSent) {
        // User might not exist (security response)
        setError("If an account exists, an OTP has been sent to your email.");
      } else {
        // Email sending failed
        setError(result.message || "Failed to send OTP. Please check your email configuration or try again later.");
      }
    } catch (error: any) {
      console.error("OTP login error:", error);
      setError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

    const handleOtpVerification = async () => {
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (authLoading) {
      console.log('⚠️ OTP verification already in progress, ignoring');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await otpService.verifyLoginOtp(
        formData.identifier,
        formData.otpCode,
      );

                  if (result.success && result.user && result.token) {
        console.log('✅ OTP login successful, setting auth state:', result.user);

                // Directly set authentication state for successful OTP login
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

                console.log('✅ OTP Auth state updated:', {
          user: result.user?.username,
          isAuthenticated: true
        });

        setAuthSuccess("Login successful!");

        // Clear form state to prevent resubmission
        setFormData(prev => ({ ...prev, otpCode: "" }));
        setAuthLoading(false);

        // Call onLogin immediately
        console.log('🔄 Calling onLogin callback for OTP');
        onLogin?.();
      } else {
        setError(
          result.message ||
            "Invalid verification code. Please check your email and try again.",
        );
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegistrationEmailVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setAuthLoading(true);
    setError(null);
    setAuthSuccess("");
    
    try {
      const result = await otpService.sendRegistrationOtp(formData.email);

      if (result.success && result.otpSent) {
        setOtpSentTo(formData.email);
        setCurrentStep("otp-verification");
        setOtpTimer(result.expiresIn || 600);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setCanResendOtp(false);
        setAuthSuccess(result.message);
      } else {
        setError(result.message || "Failed to send verification code. Please check your email configuration.");
      }
    } catch (error: any) {
      console.error("Registration OTP error:", error);
      setError(error.message || "Failed to send verification code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

    const handleRegistrationOtpVerification = async () => {
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (authLoading) {
      console.log('⚠️ Registration OTP verification already in progress, ignoring');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await otpService.verifyRegistrationOtp(
        formData.email,
        formData.otpCode,
      );

      if (result.success) {
        setCurrentStep("registration-details");
        setAuthSuccess("Email verified! Complete your registration below.");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setAuthLoading(true);
    try {
      const result = await otpService.completeRegistration({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });

                  if (result.success && result.user && result.token) {
        console.log('✅ Registration successful, setting auth state:', result.user);

                // Directly set authentication state for successful registration
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

                console.log('✅ Auth state updated:', {
          user: result.user?.username,
          isAuthenticated: true
        });

        setAuthSuccess("Registration successful! Welcome to CyberSecChat!");

        // Call onLogin immediately to trigger parent component update
        console.log('🔄 Calling onLogin callback');
        onLogin?.();

        // Also add a small delay as backup
        setTimeout(() => {
          console.log('🔄 Delayed onLogin callback');
          onLogin?.();
        }, 500);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    setAuthLoading(true);
    try {
      const type =
        currentStep === "otp-verification" && formData.email
          ? "register"
          : "login";
      const identifier =
        type === "register" ? formData.email : formData.identifier;

      const result = await otpService.resendOtp(identifier, type);

      if (result.success) {
        setOtpTimer(result.expiresIn || 300);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setCanResendOtp(false);
        setAuthSuccess("New verification code sent!");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderLoginStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyber-blue mb-2">Sign In</h2>
        <p className="text-gray-400">
          Choose your preferred authentication method
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div className="flex rounded-lg bg-cyber-border p-1">
        <button
          onClick={() => setAuthMethod("password")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            authMethod === "password"
              ? "bg-cyber-blue text-cyber-dark"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setAuthMethod("otp")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            authMethod === "otp"
              ? "bg-cyber-blue text-cyber-dark"
              : "text-gray-400 hover:text-white"
          }`}
        >
          OTP Login
        </button>
      </div>

      {/* Email/Username Input */}
      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Email or Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={formData.identifier}
            onChange={(e) => handleInputChange("identifier", e.target.value)}
            className="cyber-input w-full pl-10"
            placeholder="Enter your email or username"
          />
        </div>
      </div>

      {/* Password Input (only for password method) */}
      {authMethod === "password" && (
        <div>
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="cyber-input w-full pl-10 pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sign In Button */}
      <button
        onClick={
          authMethod === "password" ? handlePasswordLogin : handleOtpLogin
        }
        disabled={authLoading}
        className="w-full cyber-button flex items-center justify-center space-x-2"
      >
        {authLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
        <span>{authMethod === "password" ? "Sign In" : "Send OTP"}</span>
      </button>

      {/* Switch to Register */}
      <div className="text-center">
        <span className="text-gray-400">Don&apos;t have an account? </span>
        <button
          onClick={() => setCurrentStep("register")}
          className="text-cyber-blue hover:text-cyber-green transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );

  const renderRegisterStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyber-blue mb-2">
          Create Account
        </h2>
        <p className="text-gray-400">Enter your email to get started</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="cyber-input w-full pl-10"
            placeholder="Enter your email address"
          />
        </div>
      </div>

      <button
        onClick={handleRegistrationEmailVerification}
        disabled={authLoading}
        className="w-full cyber-button flex items-center justify-center space-x-2"
      >
        {authLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        <span>Send Verification Code</span>
      </button>

      <div className="text-center">
        <span className="text-gray-400">Already have an account? </span>
        <button
          onClick={() => setCurrentStep("login")}
          className="text-cyber-blue hover:text-cyber-green transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  );

  const renderOtpVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyber-blue mb-2">
          Enter Verification Code
        </h2>
        <p className="text-gray-400">
          We&apos;ve sent a 6-digit code to{" "}
          <span className="text-cyber-green">{otpSentTo}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={formData.otpCode}
          onChange={(e) =>
            handleInputChange(
              "otpCode",
              e.target.value.replace(/\D/g, "").slice(0, 6),
            )
          }
          className="cyber-input w-full text-center text-2xl tracking-widest"
          placeholder="000000"
          maxLength={6}
        />
      </div>

      {/* Timer */}
      {otpTimer > 0 && (
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Code expires in {formatTime(otpTimer)}</span>
        </div>
      )}

      <button
        onClick={
          formData.email
            ? handleRegistrationOtpVerification
            : handleOtpVerification
        }
        disabled={authLoading || formData.otpCode.length !== 6}
        className="w-full cyber-button flex items-center justify-center space-x-2"
      >
        {authLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        <span>Verify Code</span>
      </button>

      {/* Resend OTP */}
      <div className="text-center">
        <span className="text-gray-400">Didn&apos;t receive the code? </span>
        <button
          onClick={handleResendOtp}
          disabled={!canResendOtp || authLoading}
          className={`${
            canResendOtp
              ? "text-cyber-blue hover:text-cyber-green"
              : "text-gray-600 cursor-not-allowed"
          } transition-colors`}
        >
          Resend Code
        </button>
        {!canResendOtp && resendTimer > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            You can resend in {formatTime(resendTimer)}
          </div>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={() => {
          setCurrentStep(formData.email ? "register" : "login");
          setFormData((prev) => ({ ...prev, otpCode: "" }));
        }}
        className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>
    </div>
  );

  const renderRegistrationDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyber-blue mb-2">
          Complete Registration
        </h2>
        <p className="text-gray-400">
          Fill in your details to create your account
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className="cyber-input w-full"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className="cyber-input w-full"
            placeholder="Last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Username *
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange("username", e.target.value)}
          className="cyber-input w-full"
          placeholder="Choose a username"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="cyber-input w-full pl-10 pr-10"
            placeholder="Create a strong password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Confirm Password *
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
          className="cyber-input w-full"
          placeholder="Confirm your password"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-cyber-blue mb-2">
          Account Type
        </label>
        <select
          value={formData.role}
          onChange={(e) => handleInputChange("role", e.target.value)}
          className="cyber-input w-full"
        >
          <option value="free">Free (Basic tools)</option>
          <option value="pro">Professional (Advanced tools)</option>
          <option value="enterprise">Enterprise (Full access)</option>
        </select>
      </div>

      <button
        onClick={handleCompleteRegistration}
        disabled={authLoading}
        className="w-full cyber-button flex items-center justify-center space-x-2"
      >
        {authLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
        <span>Create Account</span>
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="cyber-panel">
        {/* Success Message */}
        {authSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-cyber-green bg-opacity-20 border border-cyber-green">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-cyber-green" />
              <span className="text-cyber-green text-sm">{authSuccess}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-cyber-red bg-opacity-20 border border-cyber-red">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-cyber-red" />
              <span className="text-cyber-red text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        {currentStep === "login" && renderLoginStep()}
        {currentStep === "register" && renderRegisterStep()}
        {currentStep === "otp-verification" && renderOtpVerificationStep()}
        {currentStep === "registration-details" &&
          renderRegistrationDetailsStep()}
      </div>
    </div>
  );
}
