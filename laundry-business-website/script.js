import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    RecaptchaVerifier, 
    signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// ==========================================
// 🔴 IMPORTANT: PASTE YOUR FIREBASE CONFIG HERE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBNZ5pAvogsFwqNQ-rnfxgihU30DvivDvE",
  authDomain: "freshwash-auth.firebaseapp.com",
  projectId: "freshwash-auth",
  storageBucket: "freshwash-auth.firebasestorage.app",
  messagingSenderId: "700801551708",
  appId: "1:700801551708:web:721ba3fd53b4e9f828c599",
  measurementId: "G-4Q5T40DEL1"
};

// Initialize Firebase only if the config is updated
let app, auth, googleProvider;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn("Firebase is not configured! Real authentication will not work until you add your config.");
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    const preloader = document.getElementById('preloader');
    const authSection = document.getElementById('auth-section');
    const mainContent = document.getElementById('main-content');
    const drum = document.getElementById('drum');
    
    // Auth elements
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const googleBtn = document.getElementById('google-btn');
    const otpAuthSection = document.getElementById('otp-auth-section');
    const otpVerifySection = document.getElementById('otp-verify-section');
    const phoneInput = document.getElementById('phone-input');
    
    // Disable scrolling during preloader and auth
    document.body.style.overflow = 'hidden';

    // Start drum rolling after machine appears
    setTimeout(() => { drum.classList.add('drum-rolling'); }, 1800); 

    // End preloader and show Auth Section
    setTimeout(() => {
        preloader.style.opacity = '0';
        authSection.classList.remove('hidden');
        setTimeout(() => { authSection.classList.add('visible'); }, 50);
        setTimeout(() => { preloader.style.display = 'none'; }, 1000);
    }, 4500); 

    // Login Success Flow
    const completeLogin = (user) => {
        console.log("Logged in successfully:", user);
        authSection.style.opacity = '0';
        mainContent.classList.remove('hidden');
        
        setTimeout(() => {
            mainContent.classList.add('visible');
            document.body.style.overflow = ''; // Restore scrolling
            authSection.style.display = 'none';
        }, 800);
    };

    // ==========================================
    // GOOGLE AUTHENTICATION
    // ==========================================
    googleBtn.addEventListener('click', () => {
        if (!auth) {
            alert("Firebase is not connected yet! Please add your API keys to script.js.");
            return;
        }
        
        googleBtn.innerHTML = "Connecting...";
        signInWithPopup(auth, googleProvider)
            .then((result) => {
                completeLogin(result.user);
            }).catch((error) => {
                console.error("Google Auth Error:", error);
                googleBtn.innerHTML = "Continue with Google";
                alert("Login failed: " + error.message);
            });
    });

    // ==========================================
    // OTP PHONE AUTHENTICATION
    // ==========================================
    
    // Initialize Recaptcha (Required for Phone Auth to prevent spam)
    if (auth) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-otp-btn', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved automatically
            }
        });
    }

    sendOtpBtn.addEventListener('click', () => {
        if (!auth) {
            alert("Firebase is not connected yet! Please add your API keys to script.js.");
            return;
        }

        const phoneNumber = "+91" + phoneInput.value.trim();
        if(phoneInput.value.trim().length >= 10) {
            sendOtpBtn.innerHTML = "Sending...";
            
            signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
                .then((confirmationResult) => {
                    window.confirmationResult = confirmationResult;
                    otpAuthSection.classList.add('hidden');
                    otpVerifySection.classList.remove('hidden');
                }).catch((error) => {
                    console.error("SMS not sent", error);
                    sendOtpBtn.innerHTML = "Send OTP";
                    alert("Error sending SMS: " + error.message);
                });
        } else {
            alert("Please enter a valid 10-digit Indian phone number");
        }
    });

    // Handle OTP input boxes auto-focusing to the next box
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    verifyOtpBtn.addEventListener('click', () => {
        if (!window.confirmationResult) return;

        // Collect the 6-digit code from the inputs
        let code = "";
        otpInputs.forEach(input => code += input.value);
        
        if(code.length === 6) {
            verifyOtpBtn.innerHTML = "Verifying...";
            window.confirmationResult.confirm(code).then((result) => {
                completeLogin(result.user);
            }).catch((error) => {
                console.error("Verification failed", error);
                verifyOtpBtn.innerHTML = "Verify & Login";
                alert("Incorrect OTP code. Try again.");
            });
        } else {
            alert("Please enter the full 6-digit OTP");
        }
    });

    // ==========================================
    // LIVE LOCATION FETCHING
    // ==========================================
    const locationWidget = document.getElementById('location-widget');
    const locationText = document.getElementById('location-text');
    const locationSubtext = document.getElementById('location-subtext');

    locationWidget.addEventListener('click', () => {
        if (!("geolocation" in navigator)) {
            locationSubtext.innerText = "Geolocation not supported";
            return;
        }

        locationText.innerText = "Locating...";
        locationSubtext.innerText = "Please allow access";

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Free reverse geocoding via OpenStreetMap (No API key needed)
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                
                // Extract the most accurate local area name
                const city = data.address.city || data.address.town || data.address.suburb || data.address.state_district || "Your Location";
                
                locationText.innerText = city;
                locationSubtext.innerText = "Service available in your area";
            } catch (error) {
                locationText.innerText = "Location Error";
                locationSubtext.innerText = "Could not fetch city";
            }
        }, (error) => {
            locationText.innerText = "Current Location";
            locationSubtext.innerText = "Permission denied";
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});
