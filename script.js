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
  if (typeof renderActiveOrders === 'function') {
    renderActiveOrders();
  }
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
  
  const targetScreen = document.getElementById('screen-' + tab);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  const targetNav = document.getElementById('nav-' + tab);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
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
  const displayVal = document.getElementById('adc-selected-val');
  
  if (addressInput && selectedLocationName && selectedLocationName !== "Detecting…" && selectedLocationName !== "Delhi, India") {
    addressInput.value = selectedLocationName;
    if (displayVal) {
      const parts = selectedLocationName.split(',');
      const shortText = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedLocationName;
      displayVal.textContent = shortText;
    }
  } else if (addressInput) {
    let saved = localStorage.getItem('hl_saved_addresses');
    let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
    if (addresses.length > 0) {
      addressInput.value = addresses[0].address;
      if (displayVal) {
        const parts = addresses[0].address.split(',');
        const shortText = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : addresses[0].address;
        displayVal.textContent = shortText;
      }
    }
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
  const address = document.getElementById('bs-address').value.trim();
  if (!address || address === 'Detecting…') {
    alert('Please enter or select a pickup address first.');
    return;
  }

  const service = document.getElementById('bs-service').value;
  const isLaundry = service === 'wf' || service === 'wi' || service === 'sp';
  let weight = 0;
  if (isLaundry) {
    weight = parseFloat(document.getElementById('bs-weight').value) || 0;
    if (weight <= 0) {
      alert('Please enter a valid weight (minimum 1 kg).');
      return;
    }
  }

  const activeSlotBtn = document.querySelector('.time-slots .ts.active');
  const slot = activeSlotBtn ? activeSlotBtn.textContent : 'Now';

  let rate = 0;
  let serviceName = '';
  let subtotal = 0;
  let pickupFee = 40;

  if (service === 'wf') {
    rate = 69;
    serviceName = 'Wash & Fold';
    subtotal = weight * rate;
    if (weight > 3) pickupFee = 0;
  } else if (service === 'wi') {
    rate = 89;
    serviceName = 'Wash & Iron';
    subtotal = weight * rate;
    if (weight > 3) pickupFee = 0;
  } else if (service === 'sp') {
    rate = 39;
    serviceName = 'Steam Press Only';
    subtotal = weight * rate;
    if (weight > 3) pickupFee = 0;
  } else if (service === 'cc_monthly') {
    rate = 999;
    serviceName = 'Car cleaning Subscription';
    subtotal = rate;
    pickupFee = 0;
  } else if (service === 'cc_daily') {
    rate = 149;
    serviceName = 'Daily Car cleaning';
    subtotal = rate;
    pickupFee = 0;
  }

  const total = subtotal + pickupFee;
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  window.pendingOrder = {
    orderId: orderId,
    service: service,
    serviceName: serviceName,
    weight: weight,
    subtotal: subtotal,
    pickupFee: pickupFee,
    address: address,
    slot: slot,
    total: total
  };

  closeBookingSheet();
  showPaymentPage();
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
  { label: "Home", icon: "🏠", address: "Building 6, Mandi Rd, New Manglapuri, Sultanpur, New Delhi, Delhi 110030, India" },
  { label: "Home", icon: "🏠", address: "Ground floor, Street No. 1, U Block, DLF Phase 3, Sector 24, Gurugram, Haryana 122002, India" }
];

window.selectedAddressIndex = null;
window.isAddingNewAddressFromSheet = false;

window.openSavedAddressesSheet = function() {
  document.getElementById('saved-addresses-overlay').classList.remove('hidden');
  document.getElementById('saved-addresses-sheet').classList.remove('hidden');
  window.selectedAddressIndex = null;
  
  const proceedBtn = document.getElementById('btn-address-proceed');
  if (proceedBtn) {
    proceedBtn.disabled = true;
  }
  
  renderSavedAddressesList();
  lucide.createIcons();
};

window.closeSavedAddressesSheet = function() {
  document.getElementById('saved-addresses-overlay').classList.add('hidden');
  document.getElementById('saved-addresses-sheet').classList.add('hidden');
};

window.renderSavedAddressesList = function() {
  const container = document.getElementById('sheet-saved-addresses-list');
  if (!container) return;
  
  let saved = localStorage.getItem('hl_saved_addresses');
  let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
  
  if (!saved) {
    localStorage.setItem('hl_saved_addresses', JSON.stringify(defaultSavedAddresses));
  }
  
  container.innerHTML = '';
  
  addresses.forEach((addr, index) => {
    const row = document.createElement('div');
    row.className = `address-item-row ${window.selectedAddressIndex === index ? 'selected' : ''}`;
    row.onclick = () => selectAddressItem(index);
    
    row.innerHTML = `
      <div class="address-radio-circle"></div>
      <div class="address-item-details">
        <span class="address-item-label">${addr.label}</span>
        <span class="address-item-description">${addr.address}</span>
      </div>
      <span class="address-item-menu">⋮</span>
    `;
    container.appendChild(row);
  });
};

window.selectAddressItem = function(index) {
  window.selectedAddressIndex = index;
  const proceedBtn = document.getElementById('btn-address-proceed');
  if (proceedBtn) {
    proceedBtn.disabled = false;
  }
  renderSavedAddressesList();
};

window.confirmAddressSelection = function() {
  if (window.selectedAddressIndex === null) return;
  
  let saved = localStorage.getItem('hl_saved_addresses');
  let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
  const selectedAddr = addresses[window.selectedAddressIndex];
  
  if (selectedAddr) {
    const hiddenInput = document.getElementById('bs-address');
    if (hiddenInput) {
      hiddenInput.value = selectedAddr.address;
    }
    
    const displayVal = document.getElementById('adc-selected-val');
    if (displayVal) {
      const parts = selectedAddr.address.split(',');
      const shortText = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : selectedAddr.address;
      displayVal.textContent = shortText;
    }
  }
  
  closeSavedAddressesSheet();
};

window.triggerAddNewAddress = function() {
  window.isAddingNewAddressFromSheet = true;
  closeSavedAddressesSheet();
  openLocModal();
};

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
  
  if (window.isAddingNewAddressFromSheet) {
    window.isAddingNewAddressFromSheet = false;
    
    let saved = localStorage.getItem('hl_saved_addresses');
    let currentList = saved ? JSON.parse(saved) : [...defaultSavedAddresses];
    
    const newAddr = {
      label: "Home",
      icon: "🏠",
      address: selectedLocationName
    };
    currentList.push(newAddr);
    localStorage.setItem('hl_saved_addresses', JSON.stringify(currentList));
    
    closeLocModal();
    
    setTimeout(() => {
      openSavedAddressesSheet();
    }, 300);
    return;
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

// ── Hero Carousel Slider ──
let currentHeroSlide = 0;
let heroSlideInterval = null;

window.setHeroSlide = function(index) {
  const carousel = document.getElementById('hero-carousel');
  if (!carousel) return;
  currentHeroSlide = index;
  carousel.style.transform = `translateX(-${index * 50}%)`; // Shift by 50% per slide since container width is 200%
  
  // Update indicator dots
  const indicators = document.querySelectorAll('.indicator');
  if (indicators) {
    indicators.forEach((ind, i) => {
      ind.classList.toggle('active', i === index);
    });
  }
};

function startHeroSlider() {
  stopHeroSlider();
  heroSlideInterval = setInterval(() => {
    let nextIndex = (currentHeroSlide + 1) % 2;
    setHeroSlide(nextIndex);
  }, 3000);
}

function stopHeroSlider() {
  if (heroSlideInterval) {
    clearInterval(heroSlideInterval);
  }
}

// Start slider once DOM loads
setTimeout(() => {
  startHeroSlider();
  
  // Pause on hover
  const container = document.querySelector('.hero-carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopHeroSlider);
    container.addEventListener('mouseleave', startHeroSlider);
  }
}, 1000);

// ── Checkout & Payment Page Logic ──
window.selectedPaymentMethod = null;
window.selectedUPIApp = null;

window.showPaymentPage = function() {
  const o = window.pendingOrder;
  if (!o) return;
  
  // Summary
  document.getElementById('pay-summary-service').textContent = o.serviceName;
  
  const weightRow = document.getElementById('pay-summary-weight-row');
  const isLaundry = o.service === 'wf' || o.service === 'wi' || o.service === 'sp';
  if (isLaundry) {
    weightRow.classList.remove('hidden');
    document.getElementById('pay-summary-weight').textContent = `${o.weight} kg`;
  } else {
    weightRow.classList.add('hidden');
  }
  
  document.getElementById('pay-summary-address').textContent = o.address;
  document.getElementById('pay-summary-address').title = o.address;
  document.getElementById('pay-summary-time').textContent = o.slot;
  
  // Breakdown
  document.getElementById('pay-breakdown-subtotal').textContent = `₹${o.subtotal.toFixed(0)}`;
  
  const delSpan = document.getElementById('pay-breakdown-delivery');
  if (o.pickupFee === 0) {
    delSpan.innerHTML = `<span class="pb-original-fee" style="margin-right:4px;">₹40</span><span class="pb-free-tag">Free</span>`;
  } else {
    delSpan.textContent = `₹${o.pickupFee.toFixed(0)}`;
  }
  
  document.getElementById('pay-breakdown-total').textContent = `₹${o.total.toFixed(0)}`;
  
  // Button Label
  const submitBtn = document.getElementById('btn-pay-submit');
  submitBtn.innerHTML = `<i data-lucide="lock" style="width: 16px; height: 16px; margin-right: 4px;"></i> Securely Confirm &amp; Pay ₹${o.total.toFixed(0)}`;
  
  // Reset payment selection accordion
  document.querySelectorAll('.pay-method-item').forEach(item => {
    item.classList.remove('active-method');
    const body = item.querySelector('.pay-method-body');
    if (body) body.classList.add('hidden');
  });
  window.selectedPaymentMethod = null;
  window.selectedUPIApp = null;
  
  // Reset forms
  const upiIdInput = document.getElementById('pay-upi-id');
  if (upiIdInput) upiIdInput.value = '';
  const upiMsg = document.getElementById('upi-verify-msg');
  if (upiMsg) { upiMsg.textContent = ''; upiMsg.className = 'upi-status-msg'; }
  const verifyBtn = document.getElementById('btn-upi-verify');
  if (verifyBtn) { verifyBtn.textContent = 'Verify'; verifyBtn.className = 'btn-upi-verify'; }
  
  const cardNumber = document.getElementById('pay-card-number');
  if (cardNumber) cardNumber.value = '';
  const cardExpiry = document.getElementById('pay-card-expiry');
  if (cardExpiry) cardExpiry.value = '';
  const cardCvv = document.getElementById('pay-card-cvv');
  if (cardCvv) cardCvv.value = '';
  const cardBrand = document.getElementById('card-brand-icon');
  if (cardBrand) cardBrand.textContent = '💳';
  
  switchTab('payment');
  lucide.createIcons();
};

window.togglePaymentAccordion = function(method) {
  const targetItem = document.getElementById(`method-${method}`);
  if (!targetItem) return;
  
  const isActive = targetItem.classList.contains('active-method');
  
  document.querySelectorAll('.pay-method-item').forEach(item => {
    item.classList.remove('active-method');
    const body = item.querySelector('.pay-method-body');
    if (body) body.classList.add('hidden');
  });
  
  if (!isActive) {
    targetItem.classList.add('active-method');
    const body = targetItem.querySelector('.pay-method-body');
    if (body) body.classList.remove('hidden');
    window.selectedPaymentMethod = method;
  } else {
    window.selectedPaymentMethod = null;
  }
};

window.selectUPIApp = function(app) {
  document.querySelectorAll('.upi-app-btn').forEach(btn => btn.classList.remove('selected'));
  
  if (window.selectedUPIApp === app) {
    window.selectedUPIApp = null;
  } else {
    const clickedBtn = document.querySelector(`.upi-app-btn[onclick*="${app}"]`);
    if (clickedBtn) clickedBtn.classList.add('selected');
    window.selectedUPIApp = app;
  }
};

window.verifyCustomUPI = function() {
  const upiId = document.getElementById('pay-upi-id').value.trim();
  const upiMsg = document.getElementById('upi-verify-msg');
  const verifyBtn = document.getElementById('btn-upi-verify');
  if (!upiId) {
    alert('Please enter a UPI ID first.');
    return;
  }
  
  const upiRegex = /^[\w.\-_]{3,256}@[a-zA-Z]{3,64}$/;
  if (!upiRegex.test(upiId)) {
    upiMsg.textContent = '❌ Invalid UPI ID format. E.g. name@bank';
    upiMsg.className = 'upi-status-msg error';
    return;
  }
  
  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying…';
  upiMsg.textContent = 'Validating address...';
  upiMsg.className = 'upi-status-msg';
  
  setTimeout(() => {
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verified ✓';
    verifyBtn.className = 'btn-upi-verify verified';
    upiMsg.textContent = '✓ UPI ID Verified (Harsh Jain)';
    upiMsg.className = 'upi-status-msg success';
  }, 1000);
};

// Credit Card Fields Formatting & Type Detection
function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = matches && matches[0] || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length > 0) {
    return parts.join(' ');
  } else {
    return v;
  }
}

function detectCardType(number) {
  const cleanNum = number.replace(/\s+/g, '');
  if (/^4/.test(cleanNum)) return 'visa';
  if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
  if (/^(508[5-9]|60[6-8]|6521)/.test(cleanNum)) return 'rupay';
  return 'unknown';
}

function formatCardExpiry(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return v.substring(0, 2) + '/' + v.substring(2, 4);
  }
  return v;
}

function setupCardFormatting() {
  const cardNumInput = document.getElementById('pay-card-number');
  const cardExpiryInput = document.getElementById('pay-card-expiry');
  const cardCvvInput = document.getElementById('pay-card-cvv');
  const cardBrandIcon = document.getElementById('card-brand-icon');

  if (cardNumInput) {
    cardNumInput.addEventListener('input', (e) => {
      const formatted = formatCardNumber(e.target.value);
      e.target.value = formatted;
      
      const type = detectCardType(formatted);
      if (type === 'visa') cardBrandIcon.textContent = '💳 Visa';
      else if (type === 'mastercard') cardBrandIcon.textContent = '💳 MasterCard';
      else if (type === 'rupay') cardBrandIcon.textContent = '💳 RuPay';
      else cardBrandIcon.textContent = '💳';
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', (e) => {
      e.target.value = formatCardExpiry(e.target.value);
    });
  }

  if (cardCvvInput) {
    cardCvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }
}

// Payment Simulator and Action Submit
window.processPayment = function() {
  const method = window.selectedPaymentMethod;
  if (!method) {
    alert('Please choose a payment method to proceed.');
    return;
  }
  
  if (method === 'cod') {
    const loader = document.getElementById('payment-loader-overlay');
    const title = document.getElementById('payment-loader-title');
    const sub = document.getElementById('payment-loader-sub');
    
    loader.classList.remove('hidden');
    title.textContent = 'Verifying Order Details...';
    sub.textContent = 'Generating pickup reference code';
    
    setTimeout(() => {
      title.textContent = 'Confirming Booking...';
      sub.textContent = 'Securing pickup slot with our vendor';
      
      setTimeout(() => {
        loader.classList.add('hidden');
        completeCheckout('CASH-ON-DELIVERY');
      }, 1000);
    }, 1000);
    return;
  }
  
  if (method === 'upi') {
    const upiId = document.getElementById('pay-upi-id').value.trim();
    if (!window.selectedUPIApp && !upiId) {
      alert('Please select a UPI App or enter a valid UPI ID.');
      return;
    }
    if (upiId && !document.getElementById('btn-upi-verify').classList.contains('verified')) {
      alert('Please verify your Custom UPI ID first.');
      return;
    }
  } else if (method === 'card') {
    const cardNum = document.getElementById('pay-card-number').value.replace(/\s+/g, '');
    const expiry = document.getElementById('pay-card-expiry').value;
    const cvv = document.getElementById('pay-card-cvv').value;
    
    if (cardNum.length < 15 || cardNum.length > 16) {
      alert('Please enter a valid credit card number.');
      return;
    }
    if (expiry.length < 5 || !expiry.includes('/')) {
      alert('Please enter card expiry date (MM/YY).');
      return;
    }
    const expParts = expiry.split('/');
    const mm = parseInt(expParts[0]);
    const yy = parseInt(expParts[1]);
    if (isNaN(mm) || mm < 1 || mm > 12 || isNaN(yy) || yy < 26) {
      alert('Please enter a valid expiry date (expiry cannot be in the past).');
      return;
    }
    if (cvv.length < 3) {
      alert('Please enter a valid 3-digit CVV code.');
      return;
    }
  }
  
  // Initialize Razorpay Options
  const o = window.pendingOrder;
  if (!o) return;
  
  let prefillName = 'User';
  let prefillEmail = '';
  let prefillContact = '';
  
  if (auth && auth.currentUser) {
    prefillName = auth.currentUser.displayName || 'User';
    prefillEmail = auth.currentUser.email || '';
    prefillContact = auth.currentUser.phoneNumber || '';
  }
  
  const options = {
    "key": "rzp_test_pL11L7S3aX49aM", // Standard Razorpay test public key
    "amount": Math.round(o.total * 100), // Amount in paise
    "currency": "INR",
    "name": "HouseLoop",
    "description": `Payment for ${o.serviceName} (${o.orderId})`,
    "handler": function (response) {
      const loader = document.getElementById('payment-loader-overlay');
      const title = document.getElementById('payment-loader-title');
      const sub = document.getElementById('payment-loader-sub');
      
      loader.classList.remove('hidden');
      title.textContent = 'Verifying Transaction...';
      sub.textContent = 'Connecting with Razorpay security nodes';
      
      setTimeout(() => {
        title.textContent = 'Finalizing Booking...';
        sub.textContent = 'Writing order reference ledger';
        
        setTimeout(() => {
          loader.classList.add('hidden');
          completeCheckout(response.razorpay_payment_id);
        }, 1000);
      }, 1000);
    },
    "prefill": {
      "name": prefillName,
      "email": prefillEmail,
      "contact": prefillContact
    },
    "notes": {
      "address": o.address,
      "time_slot": o.slot,
      "service_type": o.service
    },
    "theme": {
      "color": "#1B5E3B"
    },
    "modal": {
      "ondismiss": function() {
        alert('Payment cancelled. Please try again to complete the booking.');
      }
    }
  };
  
  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Razorpay SDK Error:", error);
    alert("Razorpay payment gateway failed to load. Please make sure you are online.");
  }
};

function completeCheckout(paymentId) {
  const o = window.pendingOrder;
  if (!o) return;
  
  const paymentRef = paymentId || 'COD-' + Math.floor(100000 + Math.random() * 900000);
  
  const newOrder = {
    orderId: o.orderId,
    serviceCode: o.service,
    serviceName: o.serviceName,
    weight: o.weight,
    total: o.total,
    address: o.address,
    slot: o.slot,
    paymentRef: paymentRef,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'Confirmed',
    steps: ['Confirmed', 'At vendor', 'Cleaning', 'Delivered'],
    currentStep: 0,
    eta: 'Today, within 2 hours'
  };
  
  let orders = [];
  try {
    const saved = localStorage.getItem('hl_active_orders');
    if (saved) orders = JSON.parse(saved);
  } catch(e) {}
  
  orders.unshift(newOrder);
  localStorage.setItem('hl_active_orders', JSON.stringify(orders));
  
  document.getElementById('success-order-id').textContent = '#' + o.orderId;
  document.getElementById('success-service-name').textContent = o.serviceName;
  document.getElementById('success-total-paid').textContent = `₹${o.total.toFixed(0)}`;
  
  const receiptCard = document.querySelector('.success-receipt-card');
  if (receiptCard) {
    let refRow = document.getElementById('success-ref-row');
    if (!refRow) {
      refRow = document.createElement('div');
      refRow.className = 'sr-row';
      refRow.id = 'success-ref-row';
      refRow.innerHTML = `<span class="sr-label">Payment ID</span><span class="sr-val" id="success-payment-id">-</span>`;
      receiptCard.appendChild(refRow);
    }
    document.getElementById('success-payment-id').textContent = paymentRef;
  }
  
  document.getElementById('payment-success-overlay').classList.remove('hidden');
  
  renderActiveOrders();
  lucide.createIcons();
}

window.goToTracking = function() {
  document.getElementById('payment-success-overlay').classList.add('hidden');
  switchTab('orders');
  
  const activeTabBtn = document.querySelector('.otab');
  if (activeTabBtn) {
    switchOrderTab(activeTabBtn, 'active');
  }
};

// ── Dynamic Active Orders Rendering ──
const defaultActiveOrders = [
  {
    orderId: "ORD-2841",
    serviceCode: "wi",
    serviceName: "Wash & Iron",
    weight: 3,
    total: 307,
    status: "At vendor",
    eta: "Est. delivery: Tomorrow, 6–8 PM",
    currentStep: 1,
    steps: ["Picked up", "At vendor", "Cleaning", "Delivered"]
  }
];

window.renderActiveOrders = function() {
  const container = document.getElementById('orders-active');
  if (!container) return;
  
  let orders = [];
  try {
    const saved = localStorage.getItem('hl_active_orders');
    if (saved) {
      orders = JSON.parse(saved);
    } else {
      orders = [...defaultActiveOrders];
      localStorage.setItem('hl_active_orders', JSON.stringify(orders));
    }
  } catch(e) {
    orders = [...defaultActiveOrders];
  }
  
  if (orders.length === 0) {
    container.innerHTML = `<p style="font-size:0.86rem;color:var(--sub);text-align:center;padding:40px 0;">No active orders.</p>`;
    return;
  }
  
  let html = '';
  orders.forEach(o => {
    const s0Done = o.currentStep >= 0 ? 'done' : '';
    const s0Icon = o.currentStep >= 0 ? '<div class="t-dot"><i data-lucide="check" class="t-check"></i></div>' : '<div class="t-dot"></div>';
    
    const s1Done = o.currentStep >= 1 ? 'done' : '';
    const s1Icon = o.currentStep >= 1 ? '<div class="t-dot"><i data-lucide="check" class="t-check"></i></div>' : '<div class="t-dot"></div>';
    const line1Done = o.currentStep >= 1 ? 'done' : '';
    
    const s2Done = o.currentStep >= 2 ? 'done' : '';
    const s2Icon = o.currentStep >= 2 ? '<div class="t-dot"><i data-lucide="check" class="t-check"></i></div>' : '<div class="t-dot"></div>';
    const line2Done = o.currentStep >= 2 ? 'done' : '';
    
    const s3Done = o.currentStep >= 3 ? 'done' : '';
    const s3Icon = o.currentStep >= 3 ? '<div class="t-dot"><i data-lucide="check" class="t-check"></i></div>' : '<div class="t-dot"></div>';
    const line3Done = o.currentStep >= 3 ? 'done' : '';
    
    const isLaundry = o.serviceCode === 'wf' || o.serviceCode === 'wi' || o.serviceCode === 'sp';
    const detailStr = isLaundry 
      ? `${o.serviceName} · ${o.weight} kg · ₹${o.total.toFixed(0)}`
      : `${o.serviceName} · ₹${o.total.toFixed(0)}`;
      
    const statusLabel = o.status || 'Confirmed';
    
    html += `
      <div class="order-card">
          <div class="oc-top">
              <span class="ao-id">#${o.orderId}</span>
              <span class="status-pill at-vendor">${statusLabel}</span>
          </div>
          <p class="oc-detail">${detailStr}</p>
          <div class="tracker">
              <div class="t-step ${s0Done}">${s0Icon}<span>Picked up</span></div>
              <div class="t-line ${line1Done}"></div>
              <div class="t-step ${s1Done}">${s1Icon}<span>At vendor</span></div>
              <div class="t-line ${line2Done}"></div>
              <div class="t-step ${s2Done}">${s2Icon}<span>Cleaning</span></div>
              <div class="t-line ${line3Done}"></div>
              <div class="t-step ${s3Done}">${s3Icon}<span>Delivered</span></div>
          </div>
          <p class="ao-eta">${o.eta}</p>
      </div>
    `;
  });
  
  container.innerHTML = html;
  lucide.createIcons();
};

// Initialize payment structures & list active orders on startup
setTimeout(() => {
  setupCardFormatting();
  renderActiveOrders();
}, 200);

lucide.createIcons();


