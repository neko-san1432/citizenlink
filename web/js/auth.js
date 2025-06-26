// Tab switching functionality
import { supabase } from "./api/database.js";
import {
  sanitizeInput,
  validatePhoneNumber,
  validatePassword,
  secureStorage,
  rateLimiter,
  generateCSRFToken,
} from "./utils/security.js";

// Initialize CSRF token on page load
const csrfToken = generateCSRFToken();
document.cookie = `csrf_token=${csrfToken}; SameSite=Strict; Secure`;

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.getAttribute("data-tab");

    // Update active tab button
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Show corresponding tab content
    tabContents.forEach((content) => {
      content.classList.remove("active");
      if (content.id === `${tabName}-tab`) {
        content.classList.add("active");
      }
    });
  });
});

// Toast notification function
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show";

  if (type === "error") {
    toast.classList.add("error");
  } else {
    toast.classList.add("success");
  }

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Rate limiting check
      if (!rateLimiter.isAllowed("login")) {
        showToast("Too many attempts. Please try again later.", "error");
        return;
      }

      const phone = sanitizeInput(document.getElementById("phone").value);
      const password = document.getElementById("password").value; // Don't sanitize password

      // Validate phone number
      if (!validatePhoneNumber(phone)) {
        showToast("Invalid phone number format", "error");
        return;
      }
      // Format phone number to include country code
      const formattedPhone = `+63${phone}`;
      if (formattedPhone.length > 13) {
        showToast("Invalid phone number");
        return;
      }
      // First attempt to sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
        options: {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        },
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showToast("Invalid phone number or password", "error");
        } else {
          throw error;
        }
        return;
      }

      if (data?.user) {
        // Store session securely
        secureStorage.setItem("user_session", {
          id: data.user.id,
          phone: formattedPhone,
          timestamp: Date.now(),
        });

        // Request SMS verification
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (otpError) throw otpError;

        // Store the session data temporarily
        sessionStorage.setItem(
          "pendingVerification",
          JSON.stringify({
            phone: formattedPhone,
            type: "login",
          })
        );

        showToast("Please verify your login with the OTP sent to your phone.");

        // Show OTP verification section
        document
          .getElementById("verification-section")
          .classList.remove("hidden");
        document.getElementById("verification-section").classList.add("active");
        document.getElementById("login-section").classList.add("hidden");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      showToast(error.message || "Failed to login. Please try again.", "error");
    }
  });
}

// Signup form
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const fullName = sanitizeInput(document.getElementById('fullName').value);
      const phone = sanitizeInput(document.getElementById('phone').value);
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Validate inputs
      if (!fullName || fullName.length < 2) {
        showToast('Please enter a valid full name', 'error');
        return;
      }

      if (!validatePhoneNumber(phone)) {
        showToast('Invalid phone number format', 'error');
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showToast(passwordValidation.errors[0], 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match. Please try again.', 'error');
        return;
      }
      // Format phone number to include country code
      const formattedPhone = `+63${phone}`;

      // Request phone verification first
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true
        }
      });

      if (otpError) throw otpError;

      // Store signup data temporarily
      sessionStorage.setItem('pendingVerification', JSON.stringify({
        phone: formattedPhone,
        full_name: fullName,
        password: password,
        type: 'signup'
      }));

      showToast('Please verify your phone number with the OTP sent to your phone.');

      // Show OTP verification section
      document.getElementById('verification-section').classList.remove('hidden');
      document.getElementById('verification-section').classList.add('active');
      document.getElementById('signup-section').classList.add('hidden');
    } catch (error) {
      console.error('Signup error:', error.message);
      showToast(error.message || 'Failed to create account. Please try again.', 'error');
    }
  });
}

// Handle OTP verification
const verifyOtpButton = document.getElementById("verify-otp");
if (verifyOtpButton) {
  verifyOtpButton.addEventListener("click", async () => {
    try {
      // Rate limiting check
      if (!rateLimiter.isAllowed("verify-otp")) {
        showToast("Too many attempts. Please try again later.", "error");
        return;
      }

      const otp = sanitizeInput(document.getElementById("otp").value);
      const pendingData = secureStorage.getItem("pendingVerification");

      if (!pendingData) {
        showToast("Verification session expired. Please try again.", "error");
        return;
      }

      const { phone, type, full_name, password } = pendingData;

      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      if (type === "signup") {
        // For signup, we need to update the user's profile after verification
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
          data: {
            full_name: full_name,
          },
        });

        if (updateError) throw updateError;
      }

      // Clear the pending verification data securely
      secureStorage.removeItem("pendingVerification");

      const successMessage =
        type === "signup"
          ? "Account created successfully! Redirecting to login..."
          : type === "login-otp"
          ? "Login successful! Redirecting..."
          : "Login verified! Redirecting...";

      showToast(successMessage);

      // Redirect based on verification type
      setTimeout(() => {
        window.location.href =
          type === "signup" ? "login.html" : "citizen/dashboard.html";
      }, 1500);
    } catch (error) {
      console.error("Verification error:", error.message);
      showToast(
        error.message || "Failed to verify OTP. Please try again.",
        "error"
      );
    }
  });
}

// Add resend OTP functionality
const resendOtpButton = document.getElementById("resend-otp");
if (resendOtpButton) {
  resendOtpButton.addEventListener("click", async () => {
    try {
      const pendingData = JSON.parse(
        sessionStorage.getItem("pendingVerification")
      );

      if (!pendingData) {
        showToast("Verification session expired. Please try again.", "error");
        return;
      }

      const { phone, type } = pendingData;

      // Request new OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: type === "signup",
        },
      });

      if (error) throw error;

      showToast("New OTP has been sent to your phone.");

      // Disable resend button for 30 seconds
      resendOtpButton.disabled = true;
      let countdown = 30;
      const originalText = resendOtpButton.textContent;

      const timer = setInterval(() => {
        resendOtpButton.textContent = `Resend OTP (${countdown}s)`;
        countdown--;

        if (countdown < 0) {
          clearInterval(timer);
          resendOtpButton.disabled = false;
          resendOtpButton.textContent = originalText;
        }
      }, 1000);
    } catch (error) {
      console.error("Resend OTP error:", error.message);
      showToast(
        error.message || "Failed to resend OTP. Please try again.",
        "error"
      );
    }
  });
}

// Request OTP button handler
const requestOtpButton = document.getElementById("request-otp");
if (requestOtpButton) {
  requestOtpButton.addEventListener("click", async () => {
    try {
      const phone = document.getElementById("phone").value;

      if (!phone) {
        showToast("Please enter your phone number", "error");
        return;
      }

      // Format phone number
      const formattedPhone = `+63${phone}`;

      // Request OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      // Store the phone number for verification
      sessionStorage.setItem(
        "pendingVerification",
        JSON.stringify({
          phone: formattedPhone,
          type: "login-otp",
        })
      );

      showToast("OTP has been sent to your phone.");

      // Show verification section
      document
        .getElementById("verification-section")
        .classList.remove("hidden");
      document.getElementById("verification-section").classList.add("active");
      document.getElementById("login-form").classList.add("hidden");

      // Disable the button for 30 seconds
      requestOtpButton.disabled = true;
      let countdown = 30;
      const originalText = requestOtpButton.textContent;

      const timer = setInterval(() => {
        requestOtpButton.textContent = `Request OTP (${countdown}s)`;
        countdown--;

        if (countdown < 0) {
          clearInterval(timer);
          requestOtpButton.disabled = false;
          requestOtpButton.textContent = originalText;
        }
      }, 1000);
    } catch (error) {
      console.error("Request OTP error:", error.message);
      showToast(
        error.message || "Failed to send OTP. Please try again.",
        "error"
      );
    }
  });
}

// Handle successful authentication and role-based redirect
async function handleLoginSuccess(user) {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    if (profile.status !== "active") {
      showToast("Your account is not active. Please contact support.", "error");
      return;
    }

    // Store user data securely
    secureStorage.setItem("user_session", {
      id: user.id,
      phone: user.phone,
      role: profile.role,
      timestamp: Date.now(),
    });

    showToast("Login successful! Redirecting...");

    // Role-based redirect
    setTimeout(() => {
      window.location.href =
        profile.role === "lgu"
          ? "/lgu/dashboard.html"
          : "/citizen/dashboard.html";
    }, 1500);
  } catch (error) {
    console.error("Profile fetch error:", error);
    showToast("Login error. Please try again.", "error");
  }
}

// Update login form handler
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const phone = sanitizeInput(document.getElementById("phone").value);
      const password = document.getElementById("password").value;

      if (!validatePhoneNumber(phone)) {
        showToast("Invalid phone number format", "error");
        return;
      }

      const formattedPhone = `+63${phone}`;

      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showToast("Invalid phone number or password", "error");
        } else {
          throw error;
        }
        return;
      }

      if (data?.user) {
        await handleLoginSuccess(data.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Failed to login. Please try again.", "error");
    }
  });
}
document.getElementById('phone').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
});