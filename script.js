import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// ── Firebase Config ──
const firebaseConfig = {
  apiKey: "AIzaSyBNZ5pAvogsFwqNQ-rnfxgihU30DvivDvE",
  authDomain: "freshwash-auth.firebaseapp.com",
  projectId: "freshwash-auth",
  storageBucket: "freshwash-auth.firebasestorage.app",
  messagingSenderId: "700801551708",
  appId: "1:700801551708:web:721ba3fd53b4e9f828c599"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── Preloader → Auth → App flow ──
const preloader = document.getElementById('preloader');
const authScreen = document.getElementById('auth-screen');
const appEl = document.getElementById('app');

setTimeout(() => {
  preloader.style.opacity = '0';
  preloader.style.transition = 'opacity 0.8s ease';
  setTimeout(() => {
    preloader.classList.add('hidden');
    checkAuth();
  }, 800);
}, 5000);

function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showApp(user);
    } else {
      authScreen.classList.remove('hidden');
    }
  });
}

function showApp(user) {
  authScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
  lucide.createIcons();
  fetchLocation();
  updateProfile(user);
}

function updateProfile(user) {
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar');
  if (nameEl) nameEl.textContent = user.displayName || 'User';
  if (emailEl) emailEl.textContent = user.email || user.phoneNumber || '';
  if (avatarEl && user.photoURL) {
    avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;">`;
  }
}

// ── Google Auth ──
document.getElementById('btn-google-auth').addEventListener('click', async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    showApp(result.user);
  } catch (e) {
    alert('Google sign-in failed: ' + e.message);
  }
});

// ── Phone OTP ──
let confirmationResult = null;

window.recaptchaVerifier = new RecaptchaVerifier(auth, 'btn-send-otp', {
  size: 'invisible',
  callback: () => {}
});

document.getElementById('btn-send-otp').addEventListener('click', async () => {
  const phone = document.getElementById('phone-input').value.trim();
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    alert('Please enter a valid 10-digit number.');
    return;
  }
  try {
    confirmationResult = await signInWithPhoneNumber(auth, '+91' + phone, window.recaptchaVerifier);
    document.getElementById('otp-phone-display').textContent = phone;
    document.getElementById('otp-step-1').classList.add('hidden');
    document.getElementById('otp-step-2').classList.remove('hidden');
    document.querySelector('.otp-box').focus();
  } catch (e) {
    alert('Failed to send OTP: ' + e.message);
  }
});

document.getElementById('btn-verify-otp').addEventListener('click', async () => {
  const boxes = document.querySelectorAll('.otp-box');
  const code = Array.from(boxes).map(b => b.value).join('');
  if (code.length !== 6) { alert('Enter all 6 digits.'); return; }
  try {
    const result = await confirmationResult.confirm(code);
    showApp(result.user);
  } catch (e) {
    alert('Invalid OTP. Try again.');
  }
});

document.getElementById('btn-resend').addEventListener('click', () => {
  document.getElementById('otp-step-2').classList.add('hidden');
  document.getElementById('otp-step-1').classList.remove('hidden');
});

// OTP box auto-advance
document.querySelectorAll('.otp-box').forEach((box, i, boxes) => {
  box.addEventListener('input', () => {
    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
  });
});

// ── Sign Out ──
document.getElementById('btn-logout').addEventListener('click', async () => {
  await signOut(auth);
  appEl.classList.add('hidden');
  authScreen.classList.remove('hidden');
  document.getElementById('otp-step-1').classList.remove('hidden');
  document.getElementById('otp-step-2').classList.add('hidden');
  document.getElementById('phone-input').value = '';
});

// ── Tab Navigation ──
window.switchTab = function(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + tab).classList.add('active');
  document.getElementById('nav-' + tab).classList.add('active');
  lucide.createIcons();
};

// ── Order Tabs ──
window.switchOrderTab = function(btn, type) {
  document.querySelectorAll('.otab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('orders-active').classList.toggle('hidden', type !== 'active');
  document.getElementById('orders-history').classList.toggle('hidden', type !== 'history');
};

// ── Service Selection ──
window.selectSvc = function(el) {
  document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('active-svc'));
  el.classList.add('active-svc');
};

// ── Booking Sheet ──
window.openBookingSheet = function() {
  document.getElementById('booking-overlay').classList.remove('hidden');
  const sheet = document.getElementById('booking-sheet');
  sheet.classList.remove('hidden');
  sheet.style.transform = 'translateX(-50%) translateY(0)';
};

window.closeBookingSheet = function() {
  document.getElementById('booking-overlay').classList.add('hidden');
  document.getElementById('booking-sheet').classList.add('hidden');
};

document.querySelectorAll('.ts').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ts').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelector('.bs-confirm').addEventListener('click', () => {
  closeBookingSheet();
  alert('🚀 Pickup booked! Your order is confirmed.');
});

// ── Location ──
window.fetchLocation = function() {
  const locText = document.getElementById('loc-text');
  if (!locText) return;
  locText.textContent = 'Detecting…';
  if (!navigator.geolocation) { locText.textContent = 'Location unavailable'; return; }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
      const data = await res.json();
      const addr = data.address;
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || 'Your area';
      const city = addr.city || addr.town || '';
      locText.textContent = city ? `${area}, ${city}` : area;
    } catch { locText.textContent = 'Location found'; }
  }, () => { locText.textContent = 'Enable location'; });
};

lucide.createIcons();
