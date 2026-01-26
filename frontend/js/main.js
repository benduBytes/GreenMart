// js/main.js

// --- CONFIGURATION ---
const CURRENCY = "₹"; 

// ------------------ COMPONENT LOADER ------------------
function loadComponent(id, url, callback) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load " + url);
      return res.text();
    })
    .then(html => {
      document.getElementById(id).innerHTML = html;
      if (callback) callback();
    })
    .catch(err => console.error(err));
}

// ------------------ GLOBAL VARIABLES ------------------
let loginModal, signupModal;
let menuToggle, mobileMenu;

// User Data
let currentUser = null;
let users = [];

// Cart Data (Persisted in LocalStorage)
let cartItems = JSON.parse(localStorage.getItem("cartItems")) || {};

// Template Cache
let productCardTemplate = null;

try {
  currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  users = JSON.parse(localStorage.getItem("users")) || [];
} catch (e) {
  console.error("Local storage error:", e);
}

// ------------------ INITIALIZE APP ------------------
document.addEventListener("DOMContentLoaded", () => {
  // 1. Load Navbar, Login, Signup
  loadComponent("navbar-placeholder", "components/navbar.html", attachEvents);
  loadComponent("login-placeholder", "components/login.html", attachEvents);
  loadComponent("signup-placeholder", "components/signup.html", attachEvents);

  // 2. Load Home Banner
  loadComponent("home-placeholder", "components/mainBanner.html", applyBannerLayoutRules);

  // 3. Load Categories
  loadComponent("categories-placeholder", "components/categories.html", renderCategories);

  // 4. Load Best Sellers
  loadComponent("bestseller-placeholder", "components/bestSeller.html", renderBestSellers);

  // 5. Load Bottom Banner & Render Features
  loadComponent("bottom-banner-placeholder", "components/bottomBanner.html", renderBottomBanner);

  // 6. ADD THIS: Load Newsletter
  loadComponent("newsletter-placeholder", "components/newsLetter.html", () => {
      // Optional: Add submit event listener here if you want to handle the subscription
      const form = document.querySelector("#newsletter-placeholder form");
      if(form) {
          form.addEventListener("submit", (e) => {
              e.preventDefault();
              showToast("Subscribed successfully!");
              form.reset();
          });
      }
  });

  // 7. ADD THIS: Load Footer & Render Links
  loadComponent("footer-placeholder", "components/footer.html", renderFooter);
});

// ------------------ CART LOGIC ------------------

// Update Navbar Badge
function updateNavbarBadge() {
  const countBadge = document.getElementById("cart-count");
  if (!countBadge) return;

  const totalCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  if (totalCount > 0) {
    countBadge.textContent = totalCount;
    countBadge.classList.remove("hidden");
  } else {
    countBadge.classList.add("hidden");
  }
}

// Add Item
function addToCart(itemId) {
  if (cartItems[itemId]) {
    cartItems[itemId] += 1;
  } else {
    cartItems[itemId] = 1;
    showToast("Added to Cart");
  }
  saveCart();
}

// Remove Item
function removeFromCart(itemId) {
  if (cartItems[itemId]) {
    cartItems[itemId] -= 1;
    if (cartItems[itemId] === 0) {
      delete cartItems[itemId];
      showToast("Removed from Cart");
    }
  }
  saveCart();
}

// Save & Refresh UI
function saveCart() {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  updateNavbarBadge();
  renderBestSellers(); // Re-render grid to update button states
}

// ------------------ BEST SELLER RENDERING ------------------
async function renderBestSellers() {
  const grid = document.getElementById("bestseller-grid");
  
  if (!grid || typeof products === 'undefined') return;

  // 1. Fetch Template (Once)
  if (!productCardTemplate) {
    try {
      const res = await fetch("components/productCard.html");
      if (!res.ok) throw new Error("Card template not found");
      productCardTemplate = await res.text();
    } catch (err) {
      console.error(err);
      return;
    }
  }

  // 2. Clear Grid
  grid.innerHTML = "";

  // 3. Render Items (Show only Top 5)
  const bestSellers = products.slice(0, 5); 

  bestSellers.forEach(product => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = productCardTemplate;
    const card = tempDiv.firstElementChild;

    // --- MAPPING DATA ---
    const img = card.querySelector(".card-image");
    if(img) img.src = product.image[0]; 

    const title = card.querySelector(".card-title");
    if(title) title.textContent = product.name;
    
    const category = card.querySelector(".card-category");
    if(category) category.textContent = product.category;

    const price = card.querySelector(".card-price");
    if(price) price.textContent = `${CURRENCY}${product.offerPrice}`;

    const oldPrice = card.querySelector(".card-old-price");
    if(oldPrice) oldPrice.textContent = `${CURRENCY}${product.price}`;

    // --- STARS ---
    const starsContainer = card.querySelector(".card-stars");
    if (starsContainer) {
        starsContainer.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            const starImg = document.createElement("img");
            starImg.className = "w-3.5"; 
            starImg.src = (i < 4) ? "assets/star_icon.svg" : "assets/star_dull_icon.svg";
            starsContainer.appendChild(starImg);
        }
        starsContainer.insertAdjacentHTML('beforeend', '<p class="text-xs text-gray-400 ml-1">(4)</p>');
    }

    // === BUTTON vs COUNTER LOGIC ===
    const addBtn = card.querySelector(".card-add-btn");
    const counterWidget = card.querySelector(".card-counter");
    const counterValue = card.querySelector(".counter-value");
    const btnPlus = card.querySelector(".btn-plus");
    const btnMinus = card.querySelector(".btn-minus");

    const qty = cartItems[product._id] || 0;

    if (qty > 0) {
        addBtn.classList.add("hidden");
        counterWidget.classList.remove("hidden");
        counterWidget.classList.add("flex"); 
        counterValue.textContent = qty;
    } else {
        addBtn.classList.remove("hidden");
        counterWidget.classList.add("hidden");
        counterWidget.classList.remove("flex");
    }

    // --- EVENT LISTENERS ---
    addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(product._id);
    });

    if(btnPlus) {
        btnPlus.addEventListener("click", (e) => {
            e.stopPropagation();
            addToCart(product._id);
        });
    }

    if(btnMinus) {
        btnMinus.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFromCart(product._id);
        });
    }

    card.addEventListener("click", () => {
        window.location.href = `/product.html?id=${product._id}`;
    });

    grid.appendChild(card);
  });
}

// ------------------ BOTTOM BANNER LOGIC ------------------
function renderBottomBanner() {
  const container = document.getElementById("features-container");
  
  if (!container || typeof features === 'undefined') return;

  container.innerHTML = "";

  features.forEach(feature => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-4"; 

    div.innerHTML = `
      <img src="${feature.icon}" alt="${feature.title}" class="md:w-11 w-9 object-contain" />
      <div class="flex flex-col">
        <h3 class="text-lg md:text-xl font-semibold text-gray-800">${feature.title}</h3>
        <p class="text-gray-500/70 text-xs md:text-sm leading-tight">${feature.description}</p>
      </div>
    `;

    container.appendChild(div);
  });
}

// ------------------ CATEGORY LOGIC ------------------
function renderCategories() {
  const grid = document.getElementById("categories-grid");
  if (!grid || typeof categories === 'undefined') return;

  grid.innerHTML = "";

  categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center hover:shadow-md transition-all";
    div.style.backgroundColor = cat.bgColor;

    div.addEventListener("click", () => {
      window.location.href = `/properties/${cat.path.toLowerCase()}`;
      window.scrollTo(0, 0);
    });

    div.innerHTML = `
      <img src="${cat.image}" alt="${cat.text}" class="group-hover:scale-110 transition duration-300 max-w-28" />
      <p class="text-sm font-medium text-black/80">${cat.text}</p>
    `;

    grid.appendChild(div);
  });
}

// ------------------ HELPER: TOAST ------------------
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-lg text-sm z-50 transition-opacity duration-300";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ------------------ BANNER RULES ------------------
function applyBannerLayoutRules() {
  const banner = document.getElementById("main-banner");
  if (!banner) return;
  const isSellerPath = window.location.pathname.includes("seller");
  if (isSellerPath) banner.classList.remove("banner-padding");
  else banner.classList.add("banner-padding");
}

// ------------------ ATTACH EVENTS ------------------
function attachEvents() {
  loginModal = document.getElementById("login-modal");
  signupModal = document.getElementById("signup-modal");
  menuToggle = document.getElementById("menu-toggle");
  mobileMenu = document.getElementById("mobile-menu");

  if (menuToggle && mobileMenu) {
    const newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);
    menuToggle = newToggle;

    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      mobileMenu.classList.toggle("flex");
    });
  }

  document.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu?.classList.add("hidden");
      mobileMenu?.classList.remove("flex");
    });
  });

  updateAuthButtons();
  setupForms();
  updateNavbarBadge(); 
}

// ------------------ MODAL HELPERS ------------------
window.openLogin = function() {
  signupModal?.classList.add("hidden");
  loginModal?.classList.remove("hidden");
  loginModal?.classList.add("flex");
};

window.openSignup = function() {
  loginModal?.classList.add("hidden");
  signupModal?.classList.remove("hidden");
  signupModal?.classList.add("flex");
};

window.closeAuth = function() {
  loginModal?.classList.add("hidden");
  signupModal?.classList.add("hidden");
};

// ------------------ AUTH LOGIC ------------------
function updateAuthButtons() {
  const isLoggedIn = currentUser !== null;
  
  // Mobile
  const mobileMyOrders = document.getElementById("mobile-my-orders");
  const mobileLoginBtn = document.getElementById("mobile-login-btn");
  if (mobileLoginBtn) {
    if (isLoggedIn) {
      mobileMyOrders?.classList.remove("hidden");
      mobileLoginBtn.textContent = "Logout";
      mobileLoginBtn.classList.replace("bg-indigo-500", "bg-red-500");
      
      const newMobileBtn = mobileLoginBtn.cloneNode(true);
      mobileLoginBtn.parentNode.replaceChild(newMobileBtn, mobileLoginBtn);
      newMobileBtn.onclick = () => {
        currentUser = null;
        localStorage.removeItem("currentUser");
        location.reload();
      };
    } else {
      mobileMyOrders?.classList.add("hidden");
      mobileLoginBtn.textContent = "Login";
      mobileLoginBtn.classList.replace("bg-red-500", "bg-indigo-500");
      
      const newMobileBtn = mobileLoginBtn.cloneNode(true);
      mobileLoginBtn.parentNode.replaceChild(newMobileBtn, mobileLoginBtn);
      newMobileBtn.onclick = window.openLogin;
    }
  }

  // Desktop
  const desktopLoginBtn = document.getElementById("desktop-login-btn");
  const userDropdown = document.getElementById("user-dropdown");
  const desktopLogoutBtn = document.getElementById("desktop-logout-btn");

  if (desktopLoginBtn && userDropdown) {
    if (isLoggedIn) {
      desktopLoginBtn.classList.add("hidden");
      userDropdown.classList.remove("hidden");
      userDropdown.classList.add("block");
      
      if (desktopLogoutBtn) {
        desktopLogoutBtn.onclick = () => {
          currentUser = null;
          localStorage.removeItem("currentUser");
          location.reload();
        };
      }
    } else {
      desktopLoginBtn.classList.remove("hidden");
      const newDesktopBtn = desktopLoginBtn.cloneNode(true);
      desktopLoginBtn.parentNode.replaceChild(newDesktopBtn, desktopLoginBtn);
      newDesktopBtn.onclick = window.openLogin;

      userDropdown.classList.add("hidden");
      userDropdown.classList.remove("block");
    }
  }
}

// ------------------ FORMS ------------------
function setupForms() {
  if (!loginModal || !signupModal) return;

  const loginForm = loginModal.querySelector("form");
  const signupForm = signupModal.querySelector("form");

  if (loginForm) {
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);

    newLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = newLoginForm.querySelector('input[type="email"]').value.trim();
      const password = newLoginForm.querySelector('input[type="password"]').value;

      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return alert("Invalid credentials!");

      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      window.closeAuth();
      location.reload();
    });
  }

  if (signupForm) {
    const newSignupForm = signupForm.cloneNode(true);
    signupForm.parentNode.replaceChild(newSignupForm, signupForm);

    newSignupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = newSignupForm.querySelector('input[type="email"]').value.trim();
      const password = newSignupForm.querySelector('input[type="password"]').value;

      if (users.find(u => u.email === email)) return alert("Email already registered!");

      const newUser = { email, password };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      currentUser = newUser;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      window.closeAuth();
      location.reload();
    });
  }
}
// ------------------ FOOTER LOGIC ------------------
function renderFooter() {
  const container = document.getElementById("footer-links-container");
  if (!container || typeof footerLinks === 'undefined') return;

  container.innerHTML = "";

  footerLinks.forEach(section => {
    // 1. Column Div
    const col = document.createElement("div");
    
    // 2. Title (Exact classes from your snippet)
    const title = document.createElement("h3");
    title.className = "font-semibold text-base text-gray-900 md:mb-5 mb-2";
    title.textContent = section.title;
    col.appendChild(title);

    // 3. List (Exact classes from your snippet)
    const ul = document.createElement("ul");
    ul.className = "text-sm space-y-1";

    section.links.forEach(link => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      
      // The "Redirect" logic
      a.href = link.url;
      a.textContent = link.text;
      
      // Exact styling classes
      a.className = "hover:underline transition"; 
      
      li.appendChild(a);
      ul.appendChild(li);
    });

    col.appendChild(ul);
    container.appendChild(col);
  });

  // --- Part 2: Update Copyright Year (NEW) ---
  const yearSpan = document.getElementById("copyright-year");
  if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
  }
}