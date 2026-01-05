import { useState } from "react";
import { useTheme } from "./ThemeContext";
import {
  BookOpen,
  Sparkles,
  User,
  Lock,
  Mail,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  ArrowLeft,
} from "lucide-react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

interface LoginPageProps {
  onLogin: (username: string) => void;
}

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { theme, toggleTheme } = useTheme();

  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isOTPLogin, setIsOTPLogin] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================= LOGIN (EMAIL + PASSWORD) ================= */
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!formData.email || !formData.password) {
    setError("Please enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      formData.email.trim(),
      formData.password
    );

    // 🔥 DO NOT PASS EMAIL / USERNAME
onLogin(auth.currentUser!.email!);
  } catch (err: any) {
    if (err.code === "auth/wrong-password") {
      setError("Incorrect password");
    } else if (err.code === "auth/user-not-found") {
      setError("No account found with this email");
    } else {
      setError("Login failed");
    }
  }
};


  /* ================= SIGNUP ================= */
  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!formData.email || !formData.password || !formData.confirmPassword) {
    setError("Please fill all fields");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      formData.email.trim(),
      formData.password
    );

    // OPTIONAL: store username for display
    if (formData.username) {
      await setDoc(doc(db, "users", userCred.user.uid), {
        username: formData.username,
        email: formData.email,
      });
    }

    onLogin(userCred.user.uid);
  } catch (err: any) {
    if (err.code === "auth/email-already-in-use") {
      setError("Account already exists. Please login.");
    } else {
      setError("Signup failed");
    }
  }
};


  /* ================= FORGOT PASSWORD ================= */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let email = formData.email?.trim();

      // username → email
      if (!email && formData.username) {
        const snap = await getDoc(doc(db, "usernames", formData.username));
        if (!snap.exists()) {
          setError("User not found");
          return;
        }
        email = snap.data().email;
      }

      if (!email) {
        setError("Please enter email or username");
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email");
    } catch {
      setError("Failed to send reset link");
    }
  };

  /* ================= OTP LOGIN ================= */
  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!otpSent) {
        if (!formData.mobile) {
          setError("Please enter mobile number");
          return;
        }

        if (!formData.mobile.startsWith("+")) {
          setError("Use format: +91XXXXXXXXXX");
          return;
        }

        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            { size: "invisible" }
          );
        }

        const confirmation = await signInWithPhoneNumber(
          auth,
          formData.mobile,
          window.recaptchaVerifier
        );

        window.confirmationResult = confirmation;
        setOtpSent(true);
        setSuccess("OTP sent");
        return;
      }

      await window.confirmationResult.confirm(otp);
      onLogin(formData.mobile);
    } catch {
      setError("Invalid OTP or blocked by Firebase");
      setOtpSent(false);
    }
  };

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    setOtp("");
    setOtpSent(false);
  };

  const switchToLogin = () => {
    setIsSignup(false);
    setIsForgotPassword(false);
    setIsOTPLogin(false);
    resetForm();
  };

  const switchToSignup = () => {
    setIsSignup(true);
    setIsForgotPassword(false);
    setIsOTPLogin(false);
    resetForm();
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignup(false);
    setIsOTPLogin(false);
    resetForm();
  };

  const switchToOTPLogin = () => {
    setIsOTPLogin(true);
    setIsSignup(false);
    setIsForgotPassword(false);
    resetForm();
  };

  /* ================= JSX (UI UNCHANGED) ================= */


  /* ================= UI (UNCHANGED) ================= */
return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-black dark:via-purple-950 dark:to-black flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 rounded-xl bg-white/80 dark:bg-black/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
        ) : (
          <Sun className="w-6 h-6 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
        )}
      </button>

      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-pink-400 to-purple-500 dark:from-purple-500 dark:to-purple-700 p-4 rounded-2xl shadow-xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <Sparkles className="w-8 h-8 text-purple-500 dark:text-purple-400 animate-pulse" />
          </div>
          <h1 className="text-4xl text-pink-900 dark:text-purple-200 mb-2">
            {isForgotPassword ? 'Reset Password' : isSignup ? 'Create Account' : isOTPLogin ? 'OTP Login' : 'Welcome Back'}
          </h1>
          <p className="text-pink-700 dark:text-purple-400">
            {isForgotPassword
              ? 'Enter your details to reset your password'
              : isSignup
              ? 'Start your beautiful journaling journey'
              : isOTPLogin
              ? 'Login with OTP sent to your email/mobile'
              : 'Your personal space for thoughts, dreams, and memories'}
          </p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-pink-200 dark:border-purple-700">
          {/* Back Button for sub-screens */}
          {(isForgotPassword || isOTPLogin) && (
            <button
              onClick={switchToLogin}
              className="flex items-center gap-2 text-pink-600 dark:text-purple-400 hover:text-pink-800 dark:hover:text-purple-300 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Forms */}
          
          {isForgotPassword ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Email 
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
  type="text"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="Enter your email"
  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
/>

                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Send Reset Link
              </button>
            </form>
          ) : isOTPLogin ? (
            // OTP Login Form
            <form onSubmit={handleOTPLogin} className="space-y-4">
              {!otpSent ? (
                <>
                
                  <div>
                    <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="Enter your mobile number"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                      />
                    </div>
                  </div>
                    {/* ✅ MOVE HERE */}
  <div id="recaptcha-container"></div>
                  

                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Send OTP
                  </button>
                </>

              ) : (
                <>
                  <div>
                    <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Verify OTP
                  </button>
                </>
              )}
            </form>
          ) : isSignup ? (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Your mobile number"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-purple-500 hover:text-pink-600 dark:hover:text-purple-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-purple-500 hover:text-pink-600 dark:hover:text-purple-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Account
              </button>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Email Id
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
  type="text"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="Enter your email"
  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
/>

                </div>
              </div>

              <div>
                <label className="block text-sm text-pink-700 dark:text-purple-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-purple-500 hover:text-pink-600 dark:hover:text-purple-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={switchToForgotPassword}
                  className="text-pink-600 dark:text-purple-400 hover:text-pink-800 dark:hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Login
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-pink-300 dark:border-purple-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 dark:bg-black/80 text-pink-600 dark:text-purple-400">
                    OR
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={switchToOTPLogin}
                className="w-full py-3 rounded-lg border-2 border-pink-400 dark:border-purple-600 text-pink-600 dark:text-purple-400 hover:bg-pink-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Login with OTP
              </button>
            </form>
          )}

          {/* Toggle between Login/Signup */}
          {!isForgotPassword && !isOTPLogin && (
            <div className="mt-6 text-center text-sm text-pink-700 dark:text-purple-400">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={switchToLogin}
                    className="text-pink-600 dark:text-purple-300 hover:underline"
                  >
                    Login here
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={switchToSignup}
                    className="text-pink-600 dark:text-purple-300 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-pink-700 dark:text-purple-400 text-sm italic">
            💡 Your personal space to capture memories, dreams, and thoughts
          </p>
          <p className="text-pink-600 dark:text-purple-500 text-xs">
            All data will be securely stored with Firebase
          </p>
        </div>
      </div>
    </div>
  );
}