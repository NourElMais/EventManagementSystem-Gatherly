import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Mail, Lock, User, ArrowRight, AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import api, { hostAPI, clientAPI } from "../services/api";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const AUTH_EVENT = "gatherly-auth";
const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNb: "",
  age: "",
  gender: "",
  address: "",
  clothingSize: "",
  profilePic: "",
  description: "",
};

export default function AuthModal({ show, onClose, initialRole = "host" }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeRole, setActiveRole] = useState(initialRole);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const statusRef = useRef(null);
  const navigate = useNavigate();

  useBodyScrollLock(show);

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isSignUp, show]);

  useEffect(() => {
    if (status?.text && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  if (!show) return null;

  const roles = [
    { id: "host", label: "Host"},
    { id: "client", label: "Client"},
    { id: "admin", label: "Admin"},
  ];
  const visibleRoles = isSignUp ? roles.filter((role) => role.id !== "admin") : roles;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (isSignUp) {
      if (!["host", "client"].includes(activeRole)) {
        setStatus({ type: "error", text: "Sign-up is currently available for hosts and clients only." });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setStatus({ type: "error", text: "Passwords do not match." });
        return;
      }
      try {
        const commonPayload = {
          fName: formData.firstName.trim(),
          lName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phoneNb: formData.phoneNb.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          address: formData.address.trim(),
        };
        let response;
          if (activeRole === "host") {
            const payload = {
              ...commonPayload,
              clothingSize: formData.clothingSize,
              profilePic: formData.profilePic?.trim() || undefined,
              description: formData.description?.trim() || undefined,
            };
            response = await hostAPI.signupHost(payload);
            setStatus({
              type: "success",
              text: "Host account created. Check your inbox for approval updates.",
            });
          } else {
            const payload = {
              ...commonPayload,
            };
            response = await clientAPI.signupClient(payload);
            setStatus({
              type: "success",
              text: "Client account created. You can now sign in and start booking events.",
            });
          }
          setIsSignUp(false);
          const createdEmail = response?.data?.user?.email || response?.data?.client?.email || formData.email;
          setFormData((prev) => ({
            ...INITIAL_FORM,
            email: createdEmail,
          }));
        } catch (err) {
          const message = err.response?.data?.message || "Sign-up failed";
          const validationErrors = err.response?.data?.errors;
          const details = validationErrors?.length ? `\u2022 ${validationErrors.join("\n\u2022 ")}` : "";
          setStatus({
            type: "error",
            text: [message, details].filter(Boolean).join("\n"),
          });
        }
        return;
      }

    try {
      const apiRole = activeRole === "host" ? "user" : activeRole;
      const frontendRole = activeRole === "host" ? "user" : activeRole;
      const roleLabel = activeRole === "host" ? "host" : activeRole;
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
        role: apiRole,
      });

      const storedUser = { ...response.data.user, role: frontendRole };
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(storedUser));
      localStorage.setItem("role", frontendRole);
      localStorage.setItem("userRole", roleLabel);
      window.dispatchEvent(new Event(AUTH_EVENT));

      onClose();
      navigate(activeRole === "admin" ? "/admin" : activeRole === "client" ? "/client" : "/events");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setStatus({ type: "error", text: message });
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (status) setStatus(null);
  };

  const handleRoleSelect = (roleId) => {
    setActiveRole(roleId);
    if (status) setStatus(null);
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case "host": return "ocean";
      case "client": return "rose";
      case "admin": return "mint";
      default: return "ocean";
    }
  };

  const renderStatus = () => {
    if (!status?.text) return null;
    const isSuccess = status.type === "success";
    const Icon = isSuccess ? CheckCircle2 : AlertTriangle;
    const baseClasses =
      "flex items-start gap-3 px-4 py-3 rounded-xl text-sm border whitespace-pre-line";
    const styles = isSuccess
      ? "bg-mint/15 border-mint/50 text-emerald-700"
      : "bg-rose/10 border-rose/40 text-rose-700";

    return (
      <div className={`${baseClasses} ${styles}`} ref={statusRef}>
        <Icon size={18} className="mt-0.5 flex-shrink-0" />
        <span className="flex-1">{status.text}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-rose p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
          <h2 className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            {isSignUp ? "Join our community today" : "Sign in to continue"}
          </p>
        </div>

        {/* Role Selector */}
        <div className="px-6 pt-6">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
            I am a
          </p>
          <div className="flex gap-2">
            {visibleRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  activeRole === role.id
                    ? `bg-${getRoleColor(role.id)} text-white shadow-md`
                    : "bg-cream text-gray-700 hover:bg-mist"
                }`}
                style={activeRole === role.id ? {
                  backgroundColor: role.id === "host" ? "var(--color-ocean)" : 
                                   role.id === "client" ? "var(--color-rose)" : 
                                   "var(--color-mint)"
                } : {}}
              >
               
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {renderStatus()}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    placeholder=""
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange("lastName")}
                  placeholder=""
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange("password")}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isSignUp && ["host", "client"].includes(activeRole) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNb}
                    onChange={handleInputChange("phoneNb")}
                    placeholder="+961 70 123 456"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={handleInputChange("age")}
                    placeholder="26"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={activeRole !== "host" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={handleInputChange("gender")}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {activeRole === "host" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clothing Size</label>
                    <select
                      value={formData.clothingSize}
                      onChange={handleInputChange("clothingSize")}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                    >
                      <option value="">Select</option>
                      {["XS", "S", "M", "L", "XL"].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange("address")}
                  placeholder="Beirut Downtown, Biel"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                />
              </div>
              {activeRole === "host" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL (optional)</label>
                  <input
                    type="text"
                    value={formData.profilePic}
                    onChange={handleInputChange("profilePic")}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  />
                </div>
              )}
              {activeRole === "host" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio (optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange("description")}
                    placeholder="Tell clients about your experience..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean/50 focus:border-ocean"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 group"
            style={{
              backgroundColor: activeRole === "host" ? "var(--color-ocean)" : 
                               activeRole === "client" ? "var(--color-rose)" : 
                               "var(--color-mint)"
            }}
          >
            {isSignUp ? "Create Account" : "Sign In"}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatus(null);
                if (!isSignUp && activeRole === "admin") {
                  setActiveRole("host");
                }
              }}
              className="text-ocean font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
