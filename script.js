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

// ── Leaflet Map Variables ──
let map = null;
let marker = null;
let currentCoords = [28.6139, 77.2090]; // Default New Delhi coordinates
let selectedLocationName = "Delhi, India";

// Function to initialize Leaflet Map lazily
function initMap() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return;
  }

  // Initialize Leaflet Map
  map = L.map('loc-map', {
    zoomControl: true,
    attributionControl: false
  }).setView(currentCoords, 13);

  // Add OpenStreetMap tile layer (totally free)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Add dragable marker
  marker = L.marker(currentCoords, { draggable: true }).addTo(map);

  // Update marker position and reverse geocode when clicking on the map
  map.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    updateMarkerPos(lat, lng, true);
  });

  // Update marker position and reverse geocode when marker dragging ends
  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    updateMarkerPos(pos.lat, pos.lng, true);
  });
}

// Helper to update marker position, pan map, and geocode address
async function updateMarkerPos(lat, lng, reverseGeocode = true) {
  currentCoords = [lat, lng];
  if (marker) {
    marker.setLatLng(currentCoords);
  }
  if (map) {
    map.panTo(currentCoords);
  }

  if (reverseGeocode) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data && data.display_name) {
        selectedLocationName = data.display_name;
        const searchInput = document.getElementById('loc-search-input');
        if (searchInput) {
          const parts = data.display_name.split(',');
          const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : data.display_name;
          searchInput.value = shortName;
        }
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  }
}

// ── Location Modal Actions ──
window.openLocModal = function() {
  document.getElementById('loc-overlay').classList.remove('hidden');
  document.getElementById('loc-modal').classList.remove('hidden');
  initMap();
  lucide.createIcons();
};

window.closeLocModal = function() {
  document.getElementById('loc-overlay').classList.add('hidden');
  document.getElementById('loc-modal').classList.add('hidden');
  document.getElementById('loc-suggestions').innerHTML = '';
  document.getElementById('loc-search-input').value = '';
};

// Confirm selected location and update header
window.confirmSelectedLocation = function() {
  const locText = document.getElementById('loc-text');
  if (locText) {
    const parts = selectedLocationName.split(',');
    const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
    locText.textContent = shortName;
  }
  closeLocModal();
};

// Nominatim Manual Autocomplete Suggestions
let searchTimeout = null;
const searchInput = document.getElementById('loc-search-input');
const suggestionsContainer = document.getElementById('loc-suggestions');

if (searchInput) {
  // Support hitting Enter to select current typed text as fallback
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        selectedLocationName = query;
        confirmSelectedLocation();
      }
    }
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length < 3) {
      suggestionsContainer.innerHTML = '';
      return;
    }

    const showFallback = () => {
      suggestionsContainer.innerHTML = '';
      const fallbackDiv = document.createElement('div');
      fallbackDiv.className = 'loc-suggestion custom-fallback';
      fallbackDiv.style.fontWeight = 'bold';
      fallbackDiv.innerHTML = `<i data-lucide="map-pin"></i> <span>Use "${query}"</span>`;
      fallbackDiv.addEventListener('click', () => {
        selectedLocationName = query;
        confirmSelectedLocation();
      });
      suggestionsContainer.appendChild(fallbackDiv);
    };

    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        showFallback();
        
        data.slice(0, 5).forEach(item => {
          const div = document.createElement('div');
          div.className = 'loc-suggestion';
          div.innerHTML = `<i data-lucide="map-pin"></i> <span>${item.display_name}</span>`;
          div.addEventListener('click', () => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            selectedLocationName = item.display_name;
            updateMarkerPos(lat, lon, false);
            
            // Set input value to a clean display name
            const parts = item.display_name.split(',');
            const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : item.display_name;
            searchInput.value = shortName;
            
            suggestionsContainer.innerHTML = '';
          });
          suggestionsContainer.appendChild(div);
        });
        lucide.createIcons();
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        showFallback();
        lucide.createIcons();
      }
    }, 400);
  });
}

// Auto-detect current geolocation using browser API
window.fetchLocation = function() {
  const locText = document.getElementById('loc-text');
  if (!locText) return;
  
  if (searchInput) {
    searchInput.value = 'Detecting…';
  }
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    if (searchInput) searchInput.value = '';
    return;
  }
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    updateMarkerPos(lat, lng, true);
  }, () => {
    alert('Permission to retrieve location was denied.');
    if (searchInput) searchInput.value = '';
  });
};


lucide.createIcons();


