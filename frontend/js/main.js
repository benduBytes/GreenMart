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
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = html;
        if (callback) callback();
      }
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
  // --- A. GLOBAL COMPONENTS (Run on EVERY page) ---
  loadComponent("navbar-placeholder", "components/navbar.html", attachEvents);
  loadComponent("login-placeholder", "components/login.html", attachEvents);
  loadComponent("signup-placeholder", "components/signup.html", attachEvents);
  
  // Load Newsletter
  if (document.getElementById("newsletter-placeholder")) {
      loadComponent("newsletter-placeholder", "components/newsLetter.html", () => {
          const form = document.querySelector("#newsletter-placeholder form");
          if(form) {
              form.addEventListener("submit", (e) => {
                  e.preventDefault();
                  showToast("Subscribed successfully!");
                  form.reset();
              });
          }
      });
  }

  // Load Footer
  loadComponent("footer-placeholder", "components/footer.html", renderFooter);


  // --- B. PAGE-SPECIFIC COMPONENTS ---

  // 1. Home Banner
  if (document.getElementById("home-placeholder")) {
    loadComponent("home-placeholder", "components/mainBanner.html", applyBannerLayoutRules);
  }

  // 2. Categories
  if (document.getElementById("categories-placeholder")) {
    loadComponent("categories-placeholder", "components/categories.html", renderCategories);
  }

  // 3. Best Sellers
  if (document.getElementById("bestseller-placeholder")) {
    loadComponent("bestseller-placeholder", "components/bestSeller.html", renderBestSellers);
  }

  // 4. Bottom Banner
  if (document.getElementById("bottom-banner-placeholder")) {
    loadComponent("bottom-banner-placeholder", "components/bottomBanner.html", renderBottomBanner);
  }

  // 5. All Products Grid
  if (document.getElementById("all-products-grid")) {
    renderAllProductsPage();
  }

  // 6. Single Product Details (NEW)
  if (document.getElementById("product-content")) {
    renderProductDetails();
  }
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
  
  // Refresh grids if they exist to update button states
  if(document.getElementById("bestseller-grid")) renderBestSellers();
  if(document.getElementById("all-products-grid")) renderAllProductsPage();
  if(document.getElementById("related-products-grid")) {
      // Re-render related if needed to update button states, 
      // but simpler to just reload page or leave as is.
  }
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
    // Reuse the card generation logic
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

// ------------------ ALL PRODUCTS / CATEGORY PAGE LOGIC ------------------
async function renderAllProductsPage() {
    const grid = document.getElementById("all-products-grid");
    const titleElement = document.getElementById("page-title");
    
    // Safety check
    if (!grid || typeof products === 'undefined') return;

    // 1. Get URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category"); // e.g. "Vegetables"
    const searchParam = urlParams.get("search");     // e.g. "apple"

    let displayProducts = products;

    // --- LOGIC A: CATEGORY FILTER ---
    if (categoryParam) {
        const lowerCat = categoryParam.toLowerCase();

        // Filter products
        displayProducts = products.filter(item => 
            item.category.toLowerCase() === lowerCat
        );

        // Find Category Display Text (e.g. "Organic Veggies")
        if (typeof categories !== 'undefined') {
            const catObj = categories.find(c => c.path.toLowerCase() === lowerCat);
            if (catObj && titleElement) {
                titleElement.textContent = catObj.text; // Update Title
            }
        }
    } 
    // --- LOGIC B: SEARCH FILTER ---
    else if (searchParam) {
        const lowerSearch = searchParam.toLowerCase();
        displayProducts = products.filter(item => 
            item.name.toLowerCase().includes(lowerSearch) || 
            item.category.toLowerCase().includes(lowerSearch)
        );
        
        // Update Title to show search term
        if (titleElement) titleElement.textContent = `Results for "${searchParam}"`;
        
        // Show the specific search message
        const msg = document.getElementById("search-result-msg");
        const txt = document.getElementById("search-query-text");
        if (msg && txt) {
            msg.classList.remove("hidden");
            txt.textContent = searchParam;
        }
    }

    // 2. Fetch Template (Standard Logic)
    if (!productCardTemplate) {
        try {
            const res = await fetch("components/productCard.html");
            if (!res.ok) throw new Error("Template not found");
            productCardTemplate = await res.text();
        } catch (e) {
            console.error(e);
            return;
        }
    }

    // 3. Render Grid
    grid.innerHTML = "";

    if (displayProducts.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">No products found.</p>`;
        return;
    }

    displayProducts.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

// ------------------ SINGLE PRODUCT PAGE LOGIC (NEW) ------------------
function renderProductDetails() {
    // 1. Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId || typeof products === 'undefined') return;

    // 2. Find Product
    const product = products.find(p => p._id === productId);
    
    // Redirect if not found
    if (!product) {
        window.location.href = "products.html";
        return;
    }

    // 3. Populate HTML Elements
    const imgEl = document.getElementById("main-image");
    const nameEl = document.getElementById("prod-name");
    const priceEl = document.getElementById("prod-price");
    const oldPriceEl = document.getElementById("prod-old-price");
    const descEl = document.getElementById("prod-desc");
    const catEl = document.getElementById("prod-category");
    const container = document.getElementById("product-content");

    if (imgEl) imgEl.src = product.image[0];
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `${CURRENCY}${product.offerPrice}`;
    if (oldPriceEl) oldPriceEl.textContent = `${CURRENCY}${product.price}`;
    if (descEl) descEl.textContent = product.description.join(" "); // Joins array into string
    if (catEl) catEl.textContent = product.category;

    // 4. Add to Cart Logic
    const addBtn = document.getElementById("add-to-cart-btn");
    if(addBtn) {
        addBtn.addEventListener("click", () => {
            addToCart(product._id);
        });
    }

    // 5. Reveal Content (Simple fade in)
    if(container) container.classList.remove("opacity-0");

    // 6. Render Related Products (Same Category)
    renderRelatedProducts(product.category, product._id);
}

function renderRelatedProducts(category, currentId) {
    const grid = document.getElementById("related-products-grid");
    if (!grid) return;

    // Filter: Same category, exclude current item, take top 5
    const related = products
        .filter(p => p.category === category && p._id !== currentId)
        .slice(0, 5);

    if (related.length === 0) {
        grid.innerHTML = "<p>No related products found.</p>";
        return;
    }

    // Fetch template if needed (likely already loaded from main.js flow, but safety check)
    if (!productCardTemplate) {
         fetch("components/productCard.html")
            .then(res => res.text())
            .then(html => {
                productCardTemplate = html;
                related.forEach(p => grid.appendChild(createProductCard(p)));
            });
    } else {
        related.forEach(p => grid.appendChild(createProductCard(p)));
    }
}


// ------------------ HELPER: CREATE CARD ------------------
function createProductCard(product) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = productCardTemplate;
    const card = tempDiv.firstElementChild; 

    // --- 1. Map Data to HTML ---
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

    // --- 2. Stars Logic ---
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

    // --- 3. Button vs Counter Logic ---
    const addBtn = card.querySelector(".card-add-btn");
    const counterWidget = card.querySelector(".card-counter");
    const counterValue = card.querySelector(".counter-value");
    const btnPlus = card.querySelector(".btn-plus");
    const btnMinus = card.querySelector(".btn-minus");

    const updateState = () => {
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
    };
    updateState(); // Initialize immediately

    // --- 4. Event Listeners ---
    addBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        addToCart(product._id);
        updateState();
    });

    if(btnPlus) btnPlus.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(product._id);
        updateState();
    });

    if(btnMinus) btnMinus.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromCart(product._id);
        updateState();
    });

    // --- 5. MAIN NAVIGATION LOGIC (Correct for Static Environment) ---
    // Uses Query Params (?id=...) instead of folders
    card.addEventListener("click", () => {
        window.location.href = `product.html?id=${product._id}`;
    });

    return card;
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
      window.location.href = `products.html?category=${cat.path}`;
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

  // 1. Mobile Menu
  if (menuToggle && mobileMenu) {
    const newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);
    menuToggle = newToggle;
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      mobileMenu.classList.toggle("flex");
    });
  }

  // 2. Close Menu on Link Click
  document.querySelectorAll(".mobile-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu?.classList.add("hidden");
      mobileMenu?.classList.remove("flex");
    });
  });

  // 3. Highlight Active Link
  const currentPath = window.location.pathname;
  document.querySelectorAll("nav a").forEach(link => {
      const href = link.getAttribute("href");
      if (href && (currentPath.endsWith(href) || (currentPath === "/" && href === "index.html"))) {
          link.classList.add("text-black", "font-medium");
          link.classList.remove("text-gray-700");
      }
  });

  // 4. Search Logic
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const performSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      window.location.href = `products.html?search=${query}`;
    }
  };
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch();
    });
  }

  updateAuthButtons();
  setupForms();
  updateNavbarBadge(); 
}

// ------------------ MODAL & AUTH ------------------
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

function updateAuthButtons() {
  const isLoggedIn = currentUser !== null;
  const mobileLoginBtn = document.getElementById("mobile-login-btn");
  const mobileMyOrders = document.getElementById("mobile-my-orders");
  
  // Mobile
  if (mobileLoginBtn) {
    if (isLoggedIn) {
      mobileMyOrders?.classList.remove("hidden");
      mobileLoginBtn.textContent = "Logout";
      mobileLoginBtn.classList.replace("bg-[var(--primary)]", "bg-red-500");
      mobileLoginBtn.onclick = () => {
        currentUser = null;
        localStorage.removeItem("currentUser");
        location.reload();
      };
    } else {
      mobileMyOrders?.classList.add("hidden");
      mobileLoginBtn.textContent = "Login";
      mobileLoginBtn.classList.replace("bg-red-500", "bg-[var(--primary)]");
      mobileLoginBtn.onclick = window.openLogin;
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
      userDropdown.classList.add("hidden");
      userDropdown.classList.remove("block");
      desktopLoginBtn.onclick = window.openLogin;
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
    const col = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "font-semibold text-base text-gray-900 md:mb-5 mb-2";
    title.textContent = section.title;
    col.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "text-sm space-y-1";

    section.links.forEach(link => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.text;
      a.className = "hover:underline transition text-gray-600 hover:text-gray-900";
      li.appendChild(a);
      ul.appendChild(li);
    });
    col.appendChild(ul);
    container.appendChild(col);
  });

  const yearSpan = document.getElementById("copyright-year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}