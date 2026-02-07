"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, Shield, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";

interface LoginFormProps {
  onLogin?: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const { login, register, isLoading, error } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "free" as "admin" | "pro" | "enterprise" | "free",
    email: "",
    firstName: "",
    lastName: "",
    department: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });
      } else {
        if (formData.password !== formData.confirmPassword) {
          return; // Handle password mismatch
        }
        await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
        });
      }
      onLogin?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cyber-panel"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-cyber-blue mb-2">
          {isLogin ? "Access Terminal" : "Register Account"}
        </h2>
        <p className="text-sm text-gray-400">
          {isLogin
            ? "Enter your credentials to continue"
            : "Create a new secure account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="cyber-input w-full pl-10"
              placeholder="Enter username"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="cyber-input w-full pl-10 pr-10"
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyber-blue"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Email (Register only) */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="cyber-input w-full pl-10"
                placeholder="Enter email"
                required
              />
            </div>
          </div>
        )}

        {/* Confirm Password (Register only) */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="cyber-input w-full pl-10"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
        )}

        {/* Additional fields for registration */}
        {!isLogin && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-blue mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
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
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="cyber-input w-full"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="cyber-input w-full"
                placeholder="Department/Organization"
              />
            </div>
          </>
        )}

        {/* Role Selection (Register only) */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-cyber-blue mb-2">
              Account Type
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="cyber-input w-full pl-10 appearance-none"
              >
                <option value="free">Free Tier</option>
                <option value="pro">Pro Analyst</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full cyber-button py-3 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>{isLogin ? "Access System" : "Create Account"}</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-cyber-red bg-opacity-20 border border-cyber-red rounded flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-cyber-red mt-0.5 flex-shrink-0" />
            <span className="text-cyber-red text-sm">{error}</span>
          </div>
        )}
      </form>

      {/* Toggle Login/Register */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-gray-400 hover:text-cyber-blue transition-colors"
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-cyber-darker border border-cyber-red rounded flex items-start space-x-2">
        <AlertCircle className="h-4 w-4 text-cyber-red mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-400">
          <p className="font-medium text-cyber-red mb-1">Security Notice</p>
          <p>
            This is a demo application. In production, use strong passwords and
            enable 2FA.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
