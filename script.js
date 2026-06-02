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
  
  const svc = el.getAttribute('data-svc');
  const serviceSelect = document.getElementById('bs-service');
  if (serviceSelect && (svc === 'wf' || svc === 'wi')) {
    serviceSelect.value = svc;
    updateBookingPrice();
  }
};

// Dynamic Pricing Calculation for Booking Sheet
function updateBookingPrice() {
  const serviceSelect = document.getElementById('bs-service');
  const weightInput = document.getElementById('bs-weight');
  const breakdownDiv = document.getElementById('bs-price-breakdown');
  
  if (!serviceSelect || !weightInput || !breakdownDiv) return;
  
  const service = serviceSelect.value;
  const weight = parseFloat(weightInput.value) || 0;
  
  const rate = service === 'wf' ? 69 : 89;
  const serviceName = service === 'wf' ? 'Wash & Fold' : 'Wash & Iron';
  
  const subtotal = weight * rate;
  const isFreePickup = weight >= 3;
  const pickupFee = isFreePickup ? 0 : 40;
  const total = subtotal + pickupFee;
  
  let pickupFeeHTML = '';
  if (isFreePickup) {
    pickupFeeHTML = `<div><span class="pb-original-fee">₹40</span><span class="pb-free-tag">Free</span></div>`;
  } else {
    pickupFeeHTML = `<span>₹40</span>`;
  }
  
  breakdownDiv.innerHTML = `
    <div class="pb-row">
      <span>${serviceName} (${weight} kg × ₹${rate})</span>
      <span>₹${subtotal.toFixed(0)}</span>
    </div>
    <div class="pb-row">
      <span>Pickup Fee</span>
      ${pickupFeeHTML}
    </div>
    <div class="pb-row">
      <span>Estimated Total</span>
      <span>₹${total.toFixed(0)}</span>
    </div>
  `;
}

// ── Booking Sheet ──
window.openBookingSheet = function() {
  document.getElementById('booking-overlay').classList.remove('hidden');
  const sheet = document.getElementById('booking-sheet');
  sheet.classList.remove('hidden');
  sheet.style.transform = 'translateX(-50%) translateY(0)';
  
  const addressInput = document.getElementById('bs-address');
  if (addressInput && selectedLocationName && selectedLocationName !== "Detecting…" && selectedLocationName !== "Delhi, India") {
    addressInput.value = selectedLocationName;
  }

  const activeSvcCard = document.querySelector('.svc-card.active-svc');
  const serviceSelect = document.getElementById('bs-service');
  if (activeSvcCard && serviceSelect) {
    const svc = activeSvcCard.getAttribute('data-svc');
    if (svc === 'wf' || svc === 'wi') {
      serviceSelect.value = svc;
    }
  }

  updateBookingPrice();
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

// Booking Address Autocomplete
function initBookingAddressAutocomplete() {
  const bsAddress = document.getElementById('bs-address');
  const bsSuggestions = document.getElementById('bs-address-suggestions');
  if (!bsAddress || !bsSuggestions) return;

  let bsSearchTimeout = null;

  bsAddress.addEventListener('input', () => {
    clearTimeout(bsSearchTimeout);
    const query = bsAddress.value.trim();
    if (query.length < 3) {
      bsSuggestions.innerHTML = '';
      return;
    }

    bsSearchTimeout = setTimeout(() => {
      loadGoogleMapsScript(() => {
        if (!autocompleteService && window.google && window.google.maps) {
          autocompleteService = new google.maps.places.AutocompleteService();
        }
        
        if (!autocompleteService) return;

        autocompleteService.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' }
        }, (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            bsSuggestions.innerHTML = '';
            return;
          }

          bsSuggestions.innerHTML = '';
          predictions.forEach(prediction => {
            const div = document.createElement('div');
            div.className = 'loc-suggestion';
            div.innerHTML = `<i data-lucide="map-pin"></i> <span>${prediction.description}</span>`;
            div.addEventListener('click', () => {
              bsAddress.value = prediction.description;
              selectedLocationName = prediction.description;
              
              const locText = document.getElementById('loc-text');
              if (locText) {
                const parts = selectedLocationName.split(',');
                const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
                locText.textContent = shortName;
              }
              
              geocodePlaceId(prediction.place_id, prediction.description);
              bsSuggestions.innerHTML = '';
            });
            bsSuggestions.appendChild(div);
          });
          lucide.createIcons();
        });
      });
    }, 400);
  });

  document.addEventListener('click', (e) => {
    if (!bsAddress.contains(e.target) && !bsSuggestions.contains(e.target)) {
      bsSuggestions.innerHTML = '';
    }
  });
}

// Initialize autocomplete
initBookingAddressAutocomplete();

// Attach pricing event listeners
setTimeout(() => {
  document.getElementById('bs-service')?.addEventListener('change', updateBookingPrice);
  document.getElementById('bs-weight')?.addEventListener('input', updateBookingPrice);
}, 500);

// ── Google Maps Variables & Loader ──
const GOOGLE_MAPS_API_KEY = "AIzaSyA6RRDzUkhIL6FYnCNDh_E0-gEI8B3pTSQ"; // Using your active Google Maps API Key

let map = null;
let marker = null;
let currentCoords = { lat: 28.6139, lng: 77.2090 }; // Default New Delhi coordinates
let selectedLocationName = "Delhi, India";
let autocompleteService = null;
let geocoder = null;

// Catch Google Maps SDK authentication failures globally
window.gm_authFailure = function() {
  alert("Google Maps Authentication Failure!\n\nPlease make sure:\n1. Your Google API Key is valid.\n2. Billing is active on your Google Cloud project.\n3. The 'Maps JavaScript API' is enabled on your Google Cloud Console.");
  const searchInput = document.getElementById('loc-search-input');
  if (searchInput && searchInput.value === 'Detecting…') {
    searchInput.value = '';
  }
};

// Dynamic script loader for Google Maps SDK
function loadGoogleMapsScript(callback) {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  if (GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE" || !GOOGLE_MAPS_API_KEY) {
    alert("Please configure your GOOGLE_MAPS_API_KEY at the top of script.js to load the location system.");
    const searchInput = document.getElementById('loc-search-input');
    if (searchInput) searchInput.value = '';
    return;
  }

  const existingScript = document.getElementById("google-maps-sdk");
  if (existingScript) {
    existingScript.addEventListener('load', callback);
    return;
  }

  const script = document.createElement("script");
  script.id = "google-maps-sdk";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  script.onerror = () => {
    alert("Failed to load Google Maps SDK. Please check your API Key and network connection.");
    const searchInput = document.getElementById('loc-search-input');
    if (searchInput) searchInput.value = '';
  };
  document.head.appendChild(script);
}

// Function to initialize Google Map lazily
function initMap() {
  loadGoogleMapsScript(() => {
    if (map) {
      google.maps.event.trigger(map, "resize");
      map.setCenter(currentCoords);
      if (marker) {
        marker.setPosition(currentCoords);
      }
      return;
    }

    geocoder = new google.maps.Geocoder();
    autocompleteService = new google.maps.places.AutocompleteService();

    const mapOptions = {
      center: currentCoords,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true
    };

    map = new google.maps.Map(document.getElementById('loc-map'), mapOptions);

    marker = new google.maps.Marker({
      position: currentCoords,
      map: map,
      draggable: true
    });

    // Map click -> Move marker
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateMarkerPos(lat, lng, true);
    });

    // Marker drag end -> Update position
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      updateMarkerPos(pos.lat(), pos.lng(), true);
    });
    
    initAutocomplete();
  });
}

// Helper to update marker position, pan map, and geocode address
function updateMarkerPos(lat, lng, reverseGeocode = true) {
  currentCoords = { lat: lat, lng: lng };
  if (marker) {
    marker.setPosition(currentCoords);
  }
  if (map) {
    map.panTo(currentCoords);
  }

  if (reverseGeocode) {
    if (window.google && window.google.maps) {
      if (!geocoder) {
        geocoder = new google.maps.Geocoder();
      }
      geocoder.geocode({ location: currentCoords }, (results, status) => {
        const searchInput = document.getElementById('loc-search-input');
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          selectedLocationName = results[0].formatted_address;
          
          if (searchInput) {
            const parts = selectedLocationName.split(',');
            const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
            searchInput.value = shortName;
          }
          
          const locText = document.getElementById('loc-text');
          if (locText && !map) {
            const parts = selectedLocationName.split(',');
            const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
            locText.textContent = shortName;
          }
        } else {
          console.error("Geocoding failed with status:", status);
          if (searchInput && searchInput.value === 'Detecting…') {
            searchInput.value = '';
          }
          if (status === 'REQUEST_DENIED') {
            alert("Google Geocoding API Request Denied!\n\nPlease make sure that the 'Geocoding API' is enabled on your Google Cloud Console for the 'freshwash-auth' project.");
          }
        }
      });
    } else {
      const searchInput = document.getElementById('loc-search-input');
      if (searchInput && searchInput.value === 'Detecting…') {
        searchInput.value = '';
      }
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

// Google Places Autocomplete Suggestions
let searchTimeout = null;
const searchInput = document.getElementById('loc-search-input');
const suggestionsContainer = document.getElementById('loc-suggestions');

function initAutocomplete() {
  if (!searchInput) return;

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
      fallbackDiv.innerHTML = `<i data-lucide="map-pin"></i> <span>Use "${query}"</span>`;
      fallbackDiv.addEventListener('click', () => {
        selectedLocationName = query;
        confirmSelectedLocation();
      });
      suggestionsContainer.appendChild(fallbackDiv);
    };

    searchTimeout = setTimeout(() => {
      if (!autocompleteService) {
        showFallback();
        return;
      }

      autocompleteService.getPlacePredictions({
        input: query,
        componentRestrictions: { country: 'in' }
      }, (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          showFallback();
          lucide.createIcons();
          return;
        }

        suggestionsContainer.innerHTML = '';
        showFallback();

        predictions.forEach(prediction => {
          const div = document.createElement('div');
          div.className = 'loc-suggestion';
          div.innerHTML = `<i data-lucide="map-pin"></i> <span>${prediction.description}</span>`;
          div.addEventListener('click', () => {
            geocodePlaceId(prediction.place_id, prediction.description);
            suggestionsContainer.innerHTML = '';
          });
          suggestionsContainer.appendChild(div);
        });
        lucide.createIcons();
      });
    }, 400);
  });
}

// Geocode a Google Place ID into coordinates
function geocodePlaceId(placeId, displayName) {
  loadGoogleMapsScript(() => {
    if (!geocoder) {
      geocoder = new google.maps.Geocoder();
    }
    geocoder.geocode({ placeId: placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        selectedLocationName = displayName;
        
        const searchInput = document.getElementById('loc-search-input');
        if (searchInput) {
          const parts = displayName.split(',');
          const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : displayName;
          searchInput.value = shortName;
        }
        
        updateMarkerPos(lat, lng, false);
      }
    });
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
  
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    
    loadGoogleMapsScript(() => {
      updateMarkerPos(lat, lng, true);
    });
  }, () => {
    alert('Permission to retrieve location was denied.');
    if (searchInput) searchInput.value = '';
  });
};

lucide.createIcons();


