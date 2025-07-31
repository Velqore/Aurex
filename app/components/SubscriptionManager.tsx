"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  X,
  CreditCard,
  Lock,
  Zap,
  Shield,
  Users,
  Database,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "../../lib/stores/authStore";

interface SubscriptionManagerProps {
  user: any;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  role: "free" | "pro" | "enterprise";
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
  email: string;
}

export default function SubscriptionManager({
  user,
}: SubscriptionManagerProps) {
  const { updateProfile, upgradeSubscription } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
    email: user?.email || "",
  });

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "month",
      description: "Basic cybersecurity tools for learning",
      role: "free",
      features: [
        "Basic terminal access",
        "Limited command history",
        "Basic crypto tools",
        "Community support",
        "2GB file storage",
      ],
    },
    {
      id: "pro",
      name: "Professional",
      price: 29,
      period: "month",
      description: "Advanced tools for security professionals",
      role: "pro",
      popular: true,
      features: [
        "Full terminal access",
        "All penetration testing tools",
        "Unlimited command history",
        "Premium crypto tools",
        "Priority support",
        "50GB file storage",
        "Advanced threat intelligence",
        "Custom scripts execution",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      period: "month",
      description: "Complete solution for security teams",
      role: "enterprise",
      features: [
        "Everything in Professional",
        "Team collaboration tools",
        "Advanced admin panel",
        "Custom integrations",
        "24/7 dedicated support",
        "Unlimited file storage",
        "Enterprise threat feeds",
        "Custom security frameworks",
        "Multi-tenant management",
        "SSO integration",
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan && plan.price > 0) {
      setSelectedPlan(planId);
      setShowPayment(true);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Update user role based on selected plan
      const plan = plans.find((p) => p.id === selectedPlan);
      if (plan && plan.role !== "free" && user) {
        await upgradeSubscription(plan.role as "pro" | "enterprise", {
          cardNumber: paymentForm.cardNumber,
          name: paymentForm.name,
          email: paymentForm.email,
        });
      }

      setPaymentComplete(true);
      setProcessing(false);

      // Close modal after success
      setTimeout(() => {
        setShowPayment(false);
        setPaymentComplete(false);
        setSelectedPlan(null);
      }, 2000);
    } catch (error) {
      setProcessing(false);
      console.error("Payment failed:", error);
    }
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const getCurrentPlanFeatures = () => {
    const currentPlan = plans.find((p) => p.role === user?.role);
    return currentPlan?.features || [];
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="cyber-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyber-blue">Current Plan</h3>
          <div className="flex items-center space-x-2">
            {user?.role === "enterprise" && (
              <Crown className="h-5 w-5 text-yellow-400" />
            )}
            {user?.role === "pro" && (
              <Star className="h-5 w-5 text-cyber-blue" />
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyber-blue bg-opacity-20 text-cyber-blue capitalize">
              {user?.role || "Free"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-cyber-green font-medium mb-2">
              Active Features
            </h4>
            <ul className="space-y-1">
              {getCurrentPlanFeatures()
                .slice(0, 4)
                .map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-300"
                  >
                    <Check className="h-4 w-4 text-cyber-green mr-2" />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h4 className="text-cyber-blue font-medium mb-2">
              Account Details
            </h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div>
                Member since:{" "}
                {user?.joinDate
                  ? new Date(user.joinDate).toLocaleDateString()
                  : "N/A"}
              </div>
              <div>Total logins: {user?.statistics?.totalLogins || 0}</div>
              <div>Tools used: {user?.statistics?.toolsUsed || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-bold text-cyber-blue mb-6">
          Upgrade Your Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              className={`relative cyber-panel ${
                plan.popular ? "border-cyber-blue shadow-cyber" : ""
              } ${user?.role === plan.role ? "bg-cyber-blue bg-opacity-10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-cyber-blue text-cyber-dark px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-cyber-blue">
                  {plan.name}
                </h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-cyber-green mr-2 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={user?.role === plan.role}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  user?.role === plan.role
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : plan.price === 0
                      ? "border border-cyber-border text-cyber-blue hover:bg-cyber-border"
                      : "cyber-button"
                }`}
              >
                {user?.role === plan.role
                  ? "Current Plan"
                  : plan.price === 0
                    ? "Downgrade"
                    : "Upgrade Now"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cyber-gray border border-cyber-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-cyber-blue">
                    Complete Payment
                  </h3>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {!paymentComplete ? (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="cyber-panel bg-cyber-blue bg-opacity-10">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {plans.find((p) => p.id === selectedPlan)?.name} Plan
                        </span>
                        <span className="text-xl font-bold">
                          ${plans.find((p) => p.id === selectedPlan)?.price}
                          /month
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyber-blue mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={paymentForm.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="cyber-input w-full"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyber-blue mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "cardNumber",
                            formatCardNumber(e.target.value),
                          )
                        }
                        className="cyber-input w-full"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-cyber-blue mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={paymentForm.expiryDate}
                          onChange={(e) =>
                            handleInputChange("expiryDate", e.target.value)
                          }
                          className="cyber-input w-full"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyber-blue mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={paymentForm.cvv}
                          onChange={(e) =>
                            handleInputChange("cvv", e.target.value)
                          }
                          className="cyber-input w-full"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyber-blue mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={paymentForm.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="cyber-input w-full"
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span>
                        Your payment information is encrypted and secure
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full cyber-button flex items-center justify-center space-x-2"
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Complete Payment</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-cyber-green mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-cyber-green mb-2">
                      Payment Successful!
                    </h4>
                    <p className="text-gray-400">
                      Your account has been upgraded successfully.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
