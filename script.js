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

// ── Category & Service Selection ──
window.toggleCategory = function(cat) {
  const catLaundry = document.getElementById('cat-laundry');
  const catCar = document.getElementById('cat-car');
  const subLaundry = document.getElementById('sub-laundry');
  const subCar = document.getElementById('sub-car');
  
  const isLaundryActive = catLaundry?.classList.contains('active-cat');
  const isCarActive = catCar?.classList.contains('active-cat');
  
  // Collapse everything
  catLaundry?.classList.remove('active-cat');
  catCar?.classList.remove('active-cat');
  subLaundry?.classList.add('hidden-svc');
  subCar?.classList.add('hidden-svc');
  
  // Expand only if it wasn't already active
  if (cat === 'laundry' && !isLaundryActive) {
    catLaundry?.classList.add('active-cat');
    subLaundry?.classList.remove('hidden-svc');
  } else if (cat === 'car' && !isCarActive) {
    catCar?.classList.add('active-cat');
    subCar?.classList.remove('hidden-svc');
  }
  
  lucide.createIcons();
};

window.selectSvcV2 = function(svcCode) {
  const serviceSelect = document.getElementById('bs-service');
  if (serviceSelect) {
    serviceSelect.value = svcCode;
  }
  openBookingSheet(true);
};

// Dynamic Pricing Calculation for Booking Sheet
function updateBookingPrice() {
  const serviceSelect = document.getElementById('bs-service');
  const weightInput = document.getElementById('bs-weight');
  const breakdownDiv = document.getElementById('bs-price-breakdown');
  
  if (!serviceSelect || !weightInput || !breakdownDiv) return;
  
  const service = serviceSelect.value;
  const isLaundry = service === 'wf' || service === 'wi' || service === 'sp';
  
  const weightField = document.getElementById('bs-weight-field');
  if (weightField) {
    weightField.classList.toggle('hidden', !isLaundry);
  }
  
  let html = '';
  
  if (isLaundry) {
    const weight = parseFloat(weightInput.value) || 0;
    const rate = service === 'wf' ? 69 : (service === 'wi' ? 89 : 39);
    const serviceName = service === 'wf' ? 'Wash & Fold' : (service === 'wi' ? 'Wash & Iron' : 'Steam Press Only');
    
    const subtotal = weight * rate;
    const isFreePickup = weight > 3;
    const pickupFee = isFreePickup ? 0 : 40;
    const total = subtotal + pickupFee;
    
    let pickupFeeHTML = '';
    if (isFreePickup) {
      pickupFeeHTML = `<div><span class="pb-original-fee">₹40</span><span class="pb-free-tag">Free</span></div>`;
    } else {
      pickupFeeHTML = `<span>₹40</span>`;
    }
    
    const needed = 4 - weight;
    const neededStr = Number.isInteger(needed) ? needed.toString() : needed.toFixed(1);
    const nudgeHTML = (!isFreePickup && weight > 0)
      ? `<span class="pb-nudge">Add ${neededStr} more KGs to avoid the Delivery charges.</span>`
      : '';
      
    html = `
      <div class="pb-row pb-main-item">
        <div class="pb-item-info">
          <span>${serviceName} (${weight} kg × ₹${rate})</span>
          ${nudgeHTML}
        </div>
        <span class="pb-main-price">₹${subtotal.toFixed(0)}</span>
      </div>
      <div class="pb-row">
        <span class="fee-label">
          Pickup and Delivery fee
          <span class="tooltip-container">
            <i data-lucide="info" class="info-icon"></i>
            <span class="tooltip-text">this fee goes to Delivery boy for their efforts</span>
          </span>
        </span>
        ${pickupFeeHTML}
      </div>
      <div class="pb-row">
        <span>Estimated Total</span>
        <span>₹${total.toFixed(0)}</span>
      </div>
    `;
  } else {
    // Car Cleaning flat rate pricing
    const rate = service === 'cc_monthly' ? 999 : 149;
    const serviceName = service === 'cc_monthly' ? 'Car Cleaning Subscription' : 'Daily Car Cleaning';
    
    html = `
      <div class="pb-row">
        <span>${serviceName}</span>
        <span>₹${rate}</span>
      </div>
      <div class="pb-row">
        <span>Service Charge</span>
        <div><span class="pb-free-tag">Free</span></div>
      </div>
      <div class="pb-row">
        <span>Estimated Total</span>
        <span>₹${rate}</span>
      </div>
    `;
  }
  
  breakdownDiv.innerHTML = html;
  lucide.createIcons();
}

// ── Booking Sheet ──
window.openBookingSheet = function(lockService = false) {
  document.getElementById('booking-overlay').classList.remove('hidden');
  const sheet = document.getElementById('booking-sheet');
  sheet.classList.remove('hidden');
  
  const addressInput = document.getElementById('bs-address');
  if (addressInput && selectedLocationName && selectedLocationName !== "Detecting…" && selectedLocationName !== "Delhi, India") {
    addressInput.value = selectedLocationName;
  }

  const serviceSelect = document.getElementById('bs-service');
  if (serviceSelect) {
    serviceSelect.disabled = lockService;
  }

  updateBookingPrice();
  lucide.createIcons();
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

// Booking Address Saved Options Manager
const defaultSavedAddresses = [
  { label: "Home", icon: "🏠", address: "12, Ground Floor, Vasant Kunj, New Delhi, 110070" },
  { label: "Work", icon: "💼", address: "Tech Park, Phase 2, Okhla Industrial Area, New Delhi, 110020" },
  { label: "Studio", icon: "🎨", address: "Studio CREO / BOFFI Studio, Mandi Road, New Manglapuri, New Delhi, 110030" }
];

function initSavedAddresses() {
  const chipsContainer = document.getElementById('bs-saved-chips');
  if (!chipsContainer) return;
  
  function renderChips() {
    let saved = localStorage.getItem('hl_saved_addresses');
    let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
    
    chipsContainer.innerHTML = '';
    
    addresses.forEach(addr => {
      const btn = document.createElement('button');
      btn.className = 'saved-chip';
      btn.type = 'button';
      btn.innerHTML = `<span>${addr.icon}</span> ${addr.label}`;
      btn.title = addr.address;
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const bsAddress = document.getElementById('bs-address');
        if (bsAddress) {
          bsAddress.value = addr.address;
          selectedLocationName = addr.address;
          
          const locText = document.getElementById('loc-text');
          if (locText) {
            const parts = selectedLocationName.split(',');
            const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
            locText.textContent = shortName;
          }
          
          loadGoogleMapsScript(() => {
            if (!geocoder) geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: addr.address }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results[0]) {
                const location = results[0].geometry.location;
                updateMarkerPos(location.lat(), location.lng(), false);
              }
            });
          });
        }
        
        document.querySelectorAll('.saved-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
      });
      chipsContainer.appendChild(btn);
    });
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'saved-chip save-current-btn';
    saveBtn.type = 'button';
    saveBtn.innerHTML = `<i data-lucide="plus" style="width:12px;height:12px;"></i> Save Current`;
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const bsAddress = document.getElementById('bs-address');
      if (!bsAddress || !bsAddress.value.trim() || bsAddress.value === 'Detecting…') {
        alert('Please enter an address first to save it.');
        return;
      }
      const label = prompt('Enter a label for this address (e.g. Home, Work, Studio, Gym):');
      if (!label) return;
      
      const icon = prompt('Enter an emoji or icon (default: 📍):') || '📍';
      
      const newAddr = {
        label: label.trim(),
        icon: icon.trim(),
        address: bsAddress.value.trim()
      };
      
      let saved = localStorage.getItem('hl_saved_addresses');
      let currentList = saved ? JSON.parse(saved) : [...defaultSavedAddresses];
      currentList.push(newAddr);
      localStorage.setItem('hl_saved_addresses', JSON.stringify(currentList));
      
      renderChips();
    });
    chipsContainer.appendChild(saveBtn);
    lucide.createIcons();
  }
  
  renderChips();
}

// Initialize autocomplete & saved addresses
initBookingAddressAutocomplete();
initSavedAddresses();

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
window.switchLocTab = function(tab) {
  const tabSaved = document.getElementById('lm-tab-saved');
  const tabNew = document.getElementById('lm-tab-new');
  const contentSaved = document.getElementById('lm-content-saved');
  const contentNew = document.getElementById('lm-content-new');
  
  if (tab === 'saved') {
    tabSaved?.classList.add('active');
    tabNew?.classList.remove('active');
    contentSaved?.classList.remove('hidden');
    contentNew?.classList.add('hidden');
  } else {
    tabSaved?.classList.remove('active');
    tabNew?.classList.add('active');
    contentSaved?.classList.add('hidden');
    contentNew?.classList.remove('hidden');
    
    // Trigger map resize since it's now visible
    if (map) {
      setTimeout(() => {
        google.maps.event.trigger(map, "resize");
        map.setCenter(currentCoords);
      }, 50);
    }
  }
};

function renderModalSavedAddresses() {
  const modalList = document.getElementById('modal-saved-list');
  if (!modalList) return;
  
  let saved = localStorage.getItem('hl_saved_addresses');
  let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
  
  modalList.innerHTML = '';
  
  if (addresses.length === 0) {
    modalList.innerHTML = `<p style="font-size:0.84rem;color:var(--sub);text-align:center;padding:20px 0;">No saved addresses yet.</p>`;
    return;
  }
  
  addresses.forEach(addr => {
    const item = document.createElement('div');
    item.className = 'modal-saved-item';
    item.innerHTML = `
      <div class="ms-icon">${addr.icon}</div>
      <div class="ms-info">
        <div class="ms-label">${addr.label}</div>
        <div class="ms-address" title="${addr.address}">${addr.address}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      selectedLocationName = addr.address;
      confirmSelectedLocation();
      
      const bsAddress = document.getElementById('bs-address');
      if (bsAddress) {
        bsAddress.value = addr.address;
      }
      
      loadGoogleMapsScript(() => {
        if (!geocoder) geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: addr.address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const location = results[0].geometry.location;
            updateMarkerPos(location.lat(), location.lng(), false);
          }
        });
      });
    });
    modalList.appendChild(item);
  });
}

window.openLocModal = function() {
  document.getElementById('loc-overlay').classList.remove('hidden');
  document.getElementById('loc-modal').classList.remove('hidden');
  switchLocTab('saved');
  renderModalSavedAddresses();
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


