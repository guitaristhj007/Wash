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
}, 2500);

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

// ── CART STATE & UI ──
const cart = { items: [], total: 0 };

function addToCart(name, price) {
  const existing = cart.items.find(i => i.name === name);
  if (existing) { existing.qty += 1; }
  else { cart.items.push({ name, price, qty: 1 }); }
  cart.total += price;
  updateCartUI();
}
function removeFromCart(name, price) {
  const idx = cart.items.findIndex(i => i.name === name);
  if (idx === -1) return;
  cart.items[idx].qty -= 1;
  if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);
  cart.total = Math.max(0, cart.total - price);
  updateCartUI();
}
function clearCart() { cart.items = []; cart.total = 0; updateCartUI(); }

function updateCartUI() {
  const qty     = cart.items.reduce((s, i) => s + i.qty, 0);
  const badge   = document.getElementById('cart-badge');
  const bar     = document.getElementById('cart-bar');
  const barQty  = document.getElementById('cart-bar-count');
  const barAmt  = document.getElementById('cart-bar-total');
  if (badge) { badge.textContent = qty > 9 ? '9+' : qty; badge.classList.toggle('hidden', qty === 0); }
  if (bar) {
    if (qty > 0) {
      bar.classList.remove('hidden');
      bar.style.animation = 'none'; bar.offsetHeight; bar.style.animation = '';
    } else { bar.classList.add('hidden'); }
  }
  if (barQty) barQty.textContent = qty === 1 ? '1 item' : `${qty} items`;
  if (barAmt) barAmt.textContent = `₹${cart.total.toLocaleString('en-IN')}`;
}
function toggleCartBar() {
  const bar = document.getElementById('cart-bar');
  if (cart.items.length === 0) { openBookingSheet(); return; }
  if (bar) bar.classList.toggle('hidden');
}
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.toggleCartBar = toggleCartBar;

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
      displayVal.textContent = getShortAddress(selectedLocationName);
    }
  } else if (addressInput) {
    let saved = localStorage.getItem('hl_saved_addresses');
    let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
    if (addresses.length > 0) {
      addressInput.value = addresses[0].address;
      if (displayVal) {
        displayVal.textContent = getShortAddress(addresses[0].address);
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
                locText.textContent = getShortAddress(selectedLocationName);
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

function getShortAddress(address) {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length <= 2) return address;
  
  let startIndex = 0;
  while (startIndex < parts.length - 2) {
    const part = parts[startIndex];
    const isShort = part.length <= 4;
    const isNumeric = /^\d+$/.test(part);
    if (isShort || isNumeric) {
      startIndex++;
    } else {
      break;
    }
  }
  
  const subParts = parts.slice(startIndex, startIndex + 2);
  return subParts.join(', ');
}

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
      displayVal.textContent = getShortAddress(selectedAddr.address);
    }
    
    // Also update header location text!
    const locText = document.getElementById('loc-text');
    if (locText) {
      locText.textContent = getShortAddress(selectedAddr.address);
    }
  }
  
  closeSavedAddressesSheet();
};

window.triggerAddNewAddress = function() {
  window.isAddingNewAddressFromSheet = true;
  closeSavedAddressesSheet();
  openAddressSearchModal();
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
  const searchInput = document.getElementById('asm-search-input');
  if (searchInput && searchInput.value === 'Detecting current location...') {
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
    const searchInput = document.getElementById('asm-search-input');
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
    const searchInput = document.getElementById('asm-search-input');
    if (searchInput) searchInput.value = '';
  };
  document.head.appendChild(script);
}

// ── Multi-Step Address Modals Logic ──

window.openLocModal = function() {
  openAddressSearchModal();
};

window.closeLocModal = function() {
  closeAddressSearchModal();
  closeAddressPinpointModal();
};

window.openAddressSearchModal = function() {
  document.getElementById('address-search-overlay').classList.remove('hidden');
  document.getElementById('address-search-modal').classList.remove('hidden');
  const searchInput = document.getElementById('asm-search-input');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  document.getElementById('asm-suggestions').innerHTML = '';
  initAsmAutocomplete();
  lucide.createIcons();
};

window.closeAddressSearchModal = function() {
  document.getElementById('address-search-overlay').classList.add('hidden');
  document.getElementById('address-search-modal').classList.add('hidden');
};

let asmSearchTimeout = null;

function initAsmAutocomplete() {
  const asmSearchInput = document.getElementById('asm-search-input');
  const asmSuggestionsContainer = document.getElementById('asm-suggestions');
  if (!asmSearchInput || !asmSuggestionsContainer) return;

  if (asmSearchInput.dataset.autocompleteBound === 'true') {
    return;
  }
  asmSearchInput.dataset.autocompleteBound = 'true';

  asmSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = asmSearchInput.value.trim();
      if (query.length > 0) {
        geocodeAndOpenPinpoint(query);
      }
    }
  });

  asmSearchInput.addEventListener('input', () => {
    clearTimeout(asmSearchTimeout);
    const query = asmSearchInput.value.trim();
    if (query.length < 3) {
      asmSuggestionsContainer.innerHTML = '';
      return;
    }

    const showFallback = () => {
      asmSuggestionsContainer.innerHTML = '';
      const fallbackDiv = document.createElement('div');
      fallbackDiv.className = 'asm-suggestion custom-fallback';
      fallbackDiv.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;border-bottom:1px solid var(--border);';
      fallbackDiv.innerHTML = `<i data-lucide="map-pin"></i> <span>Use "${query}"</span>`;
      fallbackDiv.addEventListener('click', () => {
        geocodeAndOpenPinpoint(query);
      });
      asmSuggestionsContainer.appendChild(fallbackDiv);
      lucide.createIcons();
    };

    asmSearchTimeout = setTimeout(() => {
      loadGoogleMapsScript(() => {
        if (!autocompleteService) {
          autocompleteService = new google.maps.places.AutocompleteService();
        }
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
            return;
          }

          asmSuggestionsContainer.innerHTML = '';
          showFallback();

          predictions.forEach(prediction => {
            const div = document.createElement('div');
            div.className = 'asm-suggestion';
            div.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;border-bottom:1px solid var(--border);';
            div.innerHTML = `<i data-lucide="map-pin"></i> <span>${prediction.description}</span>`;
            div.addEventListener('click', () => {
              geocodePlaceIdAndOpenPinpoint(prediction.place_id, prediction.description);
              asmSuggestionsContainer.innerHTML = '';
            });
            asmSuggestionsContainer.appendChild(div);
          });
          lucide.createIcons();
        });
      });
    }, 400);
  });
}

function geocodeAndOpenPinpoint(query) {
  loadGoogleMapsScript(() => {
    if (!geocoder) geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        openAddressPinpointModal(results[0].formatted_address, location.lat(), location.lng());
      } else {
        openAddressPinpointModal(query, 28.6139, 77.2090);
      }
    });
  });
}

function geocodePlaceIdAndOpenPinpoint(placeId, description) {
  loadGoogleMapsScript(() => {
    if (!geocoder) geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        openAddressPinpointModal(description, location.lat(), location.lng());
      } else {
        geocodeAndOpenPinpoint(description);
      }
    });
  });
}

window.triggerCurrentLocation = function() {
  const asmSearchInput = document.getElementById('asm-search-input');
  if (asmSearchInput) {
    asmSearchInput.value = 'Detecting current location...';
  }
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    if (asmSearchInput) asmSearchInput.value = '';
    return;
  }
  
  const options = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0
  };
  
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    
    loadGoogleMapsScript(() => {
      if (!geocoder) geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          openAddressPinpointModal(results[0].formatted_address, lat, lng);
        } else {
          openAddressPinpointModal(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, lat, lng);
        }
      });
    });
  }, (error) => {
    let msg = 'Failed to retrieve location.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg = 'Location access denied. Please allow location permissions for this site in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        msg = 'Location information is unavailable. Please try again or search manually.';
        break;
      case error.TIMEOUT:
        msg = 'Location request timed out. Please try again or search manually.';
        break;
    }
    alert(msg);
    if (asmSearchInput) asmSearchInput.value = '';
  }, options);
};

window.selectRecentAddress = function(index) {
  const recentAddress = "Studio CREO, Mandi Road, New Manglapuri, Sultanpur, New Delhi, Delhi 110030, India";
  const lat = 28.4975;
  const lng = 77.1610;
  openAddressPinpointModal(recentAddress, lat, lng);
};

window.openAddressPinpointModal = function(addressName, lat, lng) {
  closeAddressSearchModal();
  
  document.getElementById('address-pinpoint-overlay').classList.remove('hidden');
  document.getElementById('address-pinpoint-modal').classList.remove('hidden');
  
  currentCoords = { lat: lat, lng: lng };
  selectedLocationName = addressName;
  
  const titleEl = document.getElementById('apm-address-title');
  const descEl = document.getElementById('apm-address-description');
  if (titleEl) {
    const parts = addressName.split(',');
    titleEl.textContent = parts.length > 0 ? parts[0].trim() : addressName;
  }
  if (descEl) {
    descEl.textContent = addressName;
  }
  
  const flatInput = document.getElementById('apm-flat-input');
  const landmarkInput = document.getElementById('apm-landmark-input');
  if (flatInput) flatInput.value = '';
  if (landmarkInput) landmarkInput.value = '';
  
  window.selectedSaveAsTag = 'Home';
  updateSaveAsChipsUI();
  
  const proceedBtn = document.getElementById('btn-save-proceed-trigger');
  if (proceedBtn) proceedBtn.disabled = true;
  
  setupFlatInputValidation();
  
  loadGoogleMapsScript(() => {
    if (!geocoder) geocoder = new google.maps.Geocoder();
    if (!autocompleteService) autocompleteService = new google.maps.places.AutocompleteService();
    
    const mapOptions = {
      center: currentCoords,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true
    };
    
    const mapContainer = document.getElementById('apm-map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
      
      map = new google.maps.Map(mapContainer, mapOptions);
      marker = new google.maps.Marker({
        position: currentCoords,
        map: map,
        draggable: true
      });
      
      map.addListener('click', (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        updatePinpointMarkerPos(newLat, newLng, true);
      });
      
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        updatePinpointMarkerPos(pos.lat(), pos.lng(), true);
      });
    }
  });
  
  lucide.createIcons();
};

window.closeAddressPinpointModal = function() {
  document.getElementById('address-pinpoint-overlay').classList.add('hidden');
  document.getElementById('address-pinpoint-modal').classList.add('hidden');
};

window.changePinpointAddress = function() {
  closeAddressPinpointModal();
  openAddressSearchModal();
};

function updatePinpointMarkerPos(lat, lng, reverseGeocode = true) {
  currentCoords = { lat: lat, lng: lng };
  if (marker) {
    marker.setPosition(currentCoords);
  }
  if (map) {
    map.panTo(currentCoords);
  }
  
  if (reverseGeocode && window.google && window.google.maps) {
    if (!geocoder) geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: currentCoords }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        selectedLocationName = results[0].formatted_address;
        
        const titleEl = document.getElementById('apm-address-title');
        const descEl = document.getElementById('apm-address-description');
        if (titleEl) {
          const parts = selectedLocationName.split(',');
          titleEl.textContent = parts.length > 0 ? parts[0].trim() : selectedLocationName;
        }
        if (descEl) {
          descEl.textContent = selectedLocationName;
        }
      }
    });
  }
}

function setupFlatInputValidation() {
  const flatInput = document.getElementById('apm-flat-input');
  const proceedBtn = document.getElementById('btn-save-proceed-trigger');
  if (!flatInput || !proceedBtn) return;
  
  const validate = () => {
    const val = flatInput.value.trim();
    proceedBtn.disabled = (val.length === 0);
  };
  
  flatInput.addEventListener('input', validate);
  flatInput.addEventListener('change', validate);
}

window.selectSaveAsTag = function(tag) {
  window.selectedSaveAsTag = tag;
  updateSaveAsChipsUI();
};

function updateSaveAsChipsUI() {
  const chipHome = document.getElementById('chip-home');
  const chipOther = document.getElementById('chip-other');
  if (!chipHome || !chipOther) return;
  
  if (window.selectedSaveAsTag === 'Home') {
    chipHome.classList.add('active');
    chipOther.classList.remove('active');
  } else {
    chipHome.classList.remove('active');
    chipOther.classList.add('active');
  }
}

window.saveAddressAndProceed = function() {
  const flatVal = document.getElementById('apm-flat-input').value.trim();
  const landmarkVal = document.getElementById('apm-landmark-input').value.trim();
  
  if (!flatVal) {
    alert("Please enter House/Flat Number");
    return;
  }
  
  const formattedAddress = `${flatVal}, ${landmarkVal ? landmarkVal + ', ' : ''}${selectedLocationName}`;
  const label = window.selectedSaveAsTag || 'Home';
  const icon = (label === 'Home') ? '🏠' : '🏢';
  
  let saved = localStorage.getItem('hl_saved_addresses');
  let currentList = saved ? JSON.parse(saved) : [...defaultSavedAddresses];
  
  const newAddr = {
    label: label,
    icon: icon,
    address: formattedAddress
  };
  currentList.push(newAddr);
  localStorage.setItem('hl_saved_addresses', JSON.stringify(currentList));
  
  window.selectedAddressIndex = currentList.length - 1;
  
  renderSavedAddressesList();
  confirmAddressSelection();
  closeAddressPinpointModal();
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

function initializeHeaderLocation() {
  const locText = document.getElementById('loc-text');
  if (!locText) return;
  
  let saved = localStorage.getItem('hl_saved_addresses');
  let addresses = saved ? JSON.parse(saved) : defaultSavedAddresses;
  
  if (addresses && addresses.length > 0) {
    const defaultAddr = addresses[0].address;
    locText.textContent = getShortAddress(defaultAddr);
    selectedLocationName = defaultAddr;
  } else {
    locText.textContent = "Delhi, India";
    selectedLocationName = "Delhi, India";
  }
}

// Initialize payment structures & list active orders on startup
setTimeout(() => {
  setupCardFormatting();
  renderActiveOrders();
  initializeHeaderLocation();
}, 200);

lucide.createIcons();


