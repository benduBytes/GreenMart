// js/main.js

// --- CONFIGURATION ---
const CURRENCY = "₹"; 

// --- ADDRESS DATA (New Functionality) ---
const defaultAddresses = [
    { 
        firstName: "John", 
        lastName: "Doe", 
        email: "john@example.com", 
        street: "GreatStack Lane", 
        city: "Mumbai", 
        state: "MH", 
        country: "India", 
        zip: "400001", 
        phone: "9876543210" 
    },
    { 
        firstName: "Jane", 
        lastName: "Smith", 
        email: "jane@example.com", 
        street: "5th Avenue", 
        city: "New York", 
        state: "NY", 
        country: "USA", 
        zip: "10001", 
        phone: "1234567890" 
    }
];

// Load addresses from LocalStorage or use defaults
let userAddresses = JSON.parse(localStorage.getItem("userAddresses")) || defaultAddresses;
let selectedAddress = userAddresses[0];

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

  // 6. Single Product Details
  if (document.getElementById("product-content")) {
    renderProductDetails();
  }

  // 7. Cart Page
  if (document.getElementById("cart-items-list")) {
    renderCartPage();
    initAddressManager(); // Initialize Address Logic
  }

  // 8. Orders Page
  if (document.getElementById("orders-container")) {
      renderOrdersPage();
  }

});

// ------------------ CART CORE LOGIC ------------------

// Update Navbar Badge
function updateNavbarBadge() {
  const totalCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  // Desktop
  const desktopBadge = document.getElementById("cart-count");
  if (desktopBadge) {
    if (totalCount > 0) {
      desktopBadge.innerText = totalCount;
      desktopBadge.classList.remove("hidden");
    } else {
      desktopBadge.classList.add("hidden");
    }
  }

  // Mobile
  const mobileBadge = document.getElementById("mobile-cart-count");
  if (mobileBadge) {
    if (totalCount > 0) {
      mobileBadge.innerText = totalCount;
      mobileBadge.classList.remove("hidden");
    } else {
      mobileBadge.classList.add("hidden");
    }
  }
}

// Add Item
function addToCart(itemId) {
  if (cartItems[itemId]) {
    cartItems[itemId] += 1;
    showToast("Cart updated");
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
  
  // Refresh specific page grids if they exist
  if(document.getElementById("bestseller-grid")) renderBestSellers();
  if(document.getElementById("all-products-grid")) renderAllProductsPage();
  
  // Refresh Cart Page if active
  if(document.getElementById("cart-items-list")) renderCartPage();
}

// ------------------ ADDRESS MANAGER (ADDED MISSING FUNCTION) ------------------
function initAddressManager() {
    const addrText = document.getElementById("current-address");
    const toggleBtn = document.getElementById("toggle-address-btn");
    const dropdown = document.getElementById("address-dropdown");

    if (!addrText || !toggleBtn || !dropdown) return;

    // 1. Function to Render Selected Address
    const renderCurrent = () => {
        if (selectedAddress) {
            const name = selectedAddress.firstName ? `${selectedAddress.firstName} ${selectedAddress.lastName}` : "User";
            const phone = selectedAddress.phone ? `<br/><span class="text-xs text-gray-500">Phone: ${selectedAddress.phone}</span>` : "";

            addrText.innerHTML = `
                <span class="font-semibold text-gray-800">${name}</span><br/>
                ${selectedAddress.street}, ${selectedAddress.city},<br/>
                ${selectedAddress.state}, ${selectedAddress.zip}
                ${phone}
            `;
        } else {
            addrText.textContent = "No address selected";
        }
    };

    // 2. Render Dropdown Options
    const renderDropdown = () => {
        dropdown.innerHTML = "";
        
        userAddresses.forEach((addr, idx) => {
            const item = document.createElement("div");
            item.className = "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 text-sm text-gray-600";
            
            const name = addr.firstName ? `${addr.firstName} ${addr.lastName}` : "Address " + (idx + 1);
            
            item.innerHTML = `
                <p class="font-medium text-gray-900">${name}</p>
                <p class="text-xs text-gray-500">${addr.street}, ${addr.city}</p>
            `;
            
            item.onclick = () => {
                selectedAddress = userAddresses[idx];
                renderCurrent();
                dropdown.classList.add("hidden");
            };
            dropdown.appendChild(item);
        });

        // Add New Address Option
        const addItem = document.createElement("div");
        addItem.className = "p-3 text-center text-[var(--primary)] font-medium cursor-pointer hover:bg-gray-50 text-sm";
        addItem.textContent = "+ Add New Address";
        addItem.onclick = () => {
            window.location.href = "add-address.html";
        };
        dropdown.appendChild(addItem);
    };

    // 3. Event Listeners
    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
        // Reload addresses in case updated in another tab
        userAddresses = JSON.parse(localStorage.getItem("userAddresses")) || defaultAddresses;
        renderDropdown();
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#address-section")) {
            dropdown.classList.add("hidden");
        }
    });

    renderCurrent();
}
// ------------------ CART PAGE RENDERER (UPDATED) ------------------
window.updateCartQuantity = function(id, value) {
    const qty = parseInt(value);
    if (qty > 0) {
        cartItems[id] = qty;
        saveCart();
    }
};

window.deleteFromCart = function(id) {
    delete cartItems[id];
    showToast("Item removed");
    saveCart();
};

function renderCartPage() {
    const container = document.getElementById("cart-items-list");
    if (!container || typeof products === 'undefined') return;

    // Clear loading/empty state
    container.innerHTML = "";

    const cartIds = Object.keys(cartItems);
    
    // 1. Handle Empty Cart
    if (cartIds.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center py-12 text-center">
            <p class="text-gray-500 text-lg mb-4">Your cart is empty.</p>
            <a href="products.html" class="text-[var(--primary)] font-medium hover:underline">Browse Products</a>
        </div>`;
        updateCartTotals(0);
        return;
    }

    let subtotal = 0;

    // 2. Loop through cart items and find product details
    cartIds.forEach(id => {
        const product = products.find(p => p._id === id);
        if (product) {
            const qty = cartItems[id];
            const itemTotal = product.offerPrice * qty;
            subtotal += itemTotal;

            const row = document.createElement("div");
            // Grid layout matching the header in cart.html
            row.className = "grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-4 border-b border-gray-100 pb-4";
            
            row.innerHTML = `
                <div class="flex items-center md:gap-6 gap-3 group">
                    <div onclick="window.location.href='product.html?id=${product._id}'" 
                         class="cursor-pointer w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border border-gray-300 rounded overflow-hidden flex-shrink-0 bg-white hover:border-[var(--primary)] transition">
                        <img class="w-full h-full object-contain p-1" src="${product.image[0]}" alt="${product.name}" />
                    </div>
                    <div onclick="window.location.href='product.html?id=${product._id}'" class="cursor-pointer">
                        <p class="font-semibold text-gray-800 text-sm md:text-base truncate max-w-[100px] md:max-w-none group-hover:text-[var(--primary)] transition">${product.name}</p>
                        <p class="text-xs text-gray-400 mt-0.5">${product.category}</p>
                    </div>
                </div>

                <div class="flex justify-center">
                    <input type="number" min="1" value="${qty}" class="border border-gray-300 w-14 py-1 text-center rounded outline-none text-gray-700 text-sm focus:border-[var(--primary)]" 
                    onchange="updateCartQuantity('${id}', this.value)">
                </div>

                <div class="flex flex-col items-center justify-center gap-2">
                    <p class="text-gray-900 font-medium">${CURRENCY}${itemTotal}</p>
                    <button onclick="deleteFromCart('${id}')" class="cursor-pointer text-gray-400 hover:text-red-500 transition p-1" title="Remove Item">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="m12.5 7.5-5 5m0-5 5 5m5.833-2.5a8.333 8.333 0 1 1-16.667 0 8.333 8.333 0 0 1 16.667 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            `;
            container.appendChild(row);
        }
    });

    updateCartTotals(subtotal);
}

function updateCartTotals(subtotal) {
    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");
    const countEl = document.getElementById("cart-total-count");

    // Tax is hardcoded for demo (2%)
    const tax = Math.round(subtotal * 0.02); 
    const finalTotal = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = `${CURRENCY}${subtotal}`;
    if (totalEl) totalEl.textContent = `${CURRENCY}${finalTotal}`;
    
    // Update Item Count Title
    if (countEl) {
        const count = Object.values(cartItems).reduce((a, b) => a + b, 0);
        countEl.textContent = `${count} Items`;
    }
}


// ------------------ BEST SELLER RENDERING ------------------
async function renderBestSellers() {
  const grid = document.getElementById("bestseller-grid");
  if (!grid || typeof products === 'undefined') return;

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

  grid.innerHTML = "";
  const bestSellers = products.slice(0, 5); 

  bestSellers.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

// ------------------ ALL PRODUCTS / CATEGORY PAGE LOGIC ------------------
async function renderAllProductsPage() {
    const grid = document.getElementById("all-products-grid");
    const titleElement = document.getElementById("page-title");
    
    if (!grid || typeof products === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category"); 
    const searchParam = urlParams.get("search");

    let displayProducts = products;

    if (categoryParam) {
        const lowerCat = categoryParam.toLowerCase();
        displayProducts = products.filter(item => 
            item.category.toLowerCase() === lowerCat
        );
        if (typeof categories !== 'undefined') {
            const catObj = categories.find(c => c.path.toLowerCase() === lowerCat);
            if (catObj && titleElement) {
                titleElement.textContent = catObj.text; 
            }
        }
    } 
    else if (searchParam) {
        const lowerSearch = searchParam.toLowerCase();
        displayProducts = products.filter(item => 
            item.name.toLowerCase().includes(lowerSearch) || 
            item.category.toLowerCase().includes(lowerSearch)
        );
        
        if (titleElement) titleElement.textContent = `Results for "${searchParam}"`;
        
        const msg = document.getElementById("search-result-msg");
        const txt = document.getElementById("search-query-text");
        if (msg && txt) {
            msg.classList.remove("hidden");
            txt.textContent = searchParam;
        }
    }

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

// ------------------ SINGLE PRODUCT PAGE LOGIC ------------------
function renderProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId || typeof products === 'undefined') return;

    const product = products.find(p => p._id === productId);
    if (!product) {
        window.location.href = "products.html";
        return;
    }

    // Elements
    const imgEl = document.getElementById("main-image");
    const nameEl = document.getElementById("prod-name");
    const priceEl = document.getElementById("prod-price");
    const oldPriceEl = document.getElementById("prod-old-price");
    const descListEl = document.getElementById("prod-desc-list");
    const galleryEl = document.getElementById("image-gallery");
    const container = document.getElementById("product-content");
    const breadCategory = document.getElementById("breadcrumb-category");
    const breadName = document.getElementById("breadcrumb-name");

    // Populate
    if (imgEl) imgEl.src = product.image[0];
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `${CURRENCY}${product.offerPrice}`;
    if (oldPriceEl) oldPriceEl.textContent = `MRP: ${CURRENCY}${product.price}`;
    
    if (breadCategory) {
        breadCategory.textContent = product.category;
        breadCategory.onclick = () => window.location.href = `products.html?category=${product.category}`;
    }
    if (breadName) breadName.textContent = product.name;

    if (descListEl) {
        descListEl.innerHTML = "";
        const descArray = Array.isArray(product.description) ? product.description : [product.description];
        descArray.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            descListEl.appendChild(li);
        });
    }

    if (galleryEl && product.image.length > 0) {
        galleryEl.innerHTML = "";
        product.image.forEach((imgSrc) => {
            const thumbContainer = document.createElement("div");
            thumbContainer.className = "border max-w-24 w-20 md:w-24 h-20 md:h-24 border-gray-500/30 rounded-lg overflow-hidden cursor-pointer hover:border-[var(--primary)] transition flex-shrink-0 bg-white";
            
            const thumbImg = document.createElement("img");
            thumbImg.src = imgSrc;
            thumbImg.alt = "Thumbnail";
            thumbImg.className = "w-full h-full object-cover hover:scale-110 transition";

            thumbContainer.addEventListener("click", () => {
                if (imgEl) imgEl.src = imgSrc;
            });

            thumbContainer.appendChild(thumbImg);
            galleryEl.appendChild(thumbContainer);
        });
    }

    // Buttons
    const addBtn = document.getElementById("add-to-cart-btn");
    if(addBtn) {
        const newBtn = addBtn.cloneNode(true); 
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.addEventListener("click", () => addToCart(product._id));
    }

    const buyBtn = document.getElementById("buy-now-btn");
    if(buyBtn) {
        const newBuyBtn = buyBtn.cloneNode(true);
        buyBtn.parentNode.replaceChild(newBuyBtn, buyBtn);
        newBuyBtn.addEventListener("click", () => {
            addToCart(product._id);
            window.location.href = "cart.html";
        });
    }

    if(container) container.classList.remove("opacity-0");
    renderRelatedProducts(product.category, product._id);
}

function renderRelatedProducts(category, currentId) {
    const grid = document.getElementById("related-products-grid");
    if (!grid || typeof products === 'undefined') return;

    const lowerCategory = category.toLowerCase();
    const related = products
        .filter(p => p.category.toLowerCase() === lowerCategory && p._id !== currentId)
        .slice(0, 5);

    grid.innerHTML = ""; 

    if (related.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-400">No related products found in ${category}.</p>`;
        return;
    }

    const appendCards = () => {
        related.forEach(p => {
             const card = createProductCard(p);
             grid.appendChild(card);
        });
    };

    if (!productCardTemplate) {
         fetch("components/productCard.html")
            .then(res => {
                if(!res.ok) throw new Error("Template not found");
                return res.text();
            })
            .then(html => {
                productCardTemplate = html;
                appendCards();
            })
            .catch(err => console.error("Error loading related template:", err));
    } else {
        appendCards();
    }
}


// ------------------ HELPER: CREATE CARD ------------------
function createProductCard(product) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = productCardTemplate;
    const card = tempDiv.firstElementChild; 

    // Data Map
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

    // Stars
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

    // Counter/Button Logic
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
    updateState();

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

// ------------------ HELPER: TOAST (FIT CONTENT TOP-CENTER) ------------------
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "pointer-events-auto bg-white text-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-100 flex items-center gap-3 transition-all duration-300 opacity-0 -translate-y-5 whitespace-nowrap";
    
    toast.innerHTML = `
        <div class="bg-green-500 rounded-full p-1 flex-shrink-0 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
        </div>
        <span class="font-medium text-sm">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove("opacity-0", "-translate-y-5");
    });

    setTimeout(() => {
        toast.classList.add("opacity-0", "-translate-y-5");
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 300);
    }, 3000);
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

  const currentPath = window.location.pathname;
  document.querySelectorAll("nav a").forEach(link => {
      const href = link.getAttribute("href");
      if (href && (currentPath.endsWith(href) || (currentPath === "/" && href === "index.html"))) {
          link.classList.add("text-black", "font-medium");
          link.classList.remove("text-gray-700");
      }
  });

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

// ------------------ ORDERS PAGE RENDERER (EXACT JSX MATCH) ------------------
function renderOrdersPage() {
    const container = document.getElementById("orders-container");
    if (!container) return;
    
    // Check if data is loaded
    if (typeof dummyOrders === 'undefined') {
        container.innerHTML = `<p class="text-red-500 text-center py-10">Error: Order data not loaded.</p>`;
        return;
    }

    container.innerHTML = "";

    if (dummyOrders.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-10">No orders found.</p>`;
        return;
    }

    // Map through Orders (JSX: {myOrders.map(...)})
    dummyOrders.forEach(order => {
        
        // Items Logic (JSX: {order.items.map(...)})
        let itemsHtml = "";
        
        order.items.forEach((itemObj, index) => {
            const product = itemObj.product;
            if (!product) return;

            const imageSrc = Array.isArray(product.image) ? product.image[0] : product.image;
            const dateString = new Date(order.createdAt).toLocaleDateString();
            const itemTotal = product.offerPrice * itemObj.quantity;

            // Conditional Border (JSX: order.items.length !== index + 1 && "border-b")
            const borderClass = (order.items.length !== index + 1) ? "border-b border-gray-200" : "";

            itemsHtml += `
                <div class="relative bg-white text-gray-500 ${borderClass} flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-8 w-full">
                    
                    <div class="flex items-center mb-4 md:mb-0">
                        <div class="bg-[var(--primary)]/10 p-2 rounded-lg">
                            <img src="${imageSrc}" alt="" class="w-16 h-16 object-contain mix-blend-multiply" />
                        </div>
                        <div class="ml-4">
                            <h2 class="text-lg font-medium text-gray-800">${product.name}</h2>
                            <p class="text-sm">Category: ${product.category}</p>
                        </div>
                    </div>

                    <div class="text-gray-600 text-sm font-medium space-y-1">
                        <p>Quantity: ${itemObj.quantity || "1"}</p>
                        <p>Status: <span class="text-gray-800">${order.status}</span></p>
                        <p>Date: ${dateString}</p>
                    </div>

                    <p class="text-[var(--primary)] text-lg font-medium mt-2 md:mt-0">
                        Amount: ${CURRENCY} ${itemTotal}
                    </p>

                </div>
            `;
        });

        // Construct the Card (JSX: <div className='border border-gray-300 rounded-lg...'>)
        const orderCard = document.createElement("div");
        orderCard.className = "border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl bg-white";
        
        orderCard.innerHTML = `
            <div class="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col pb-4 border-b border-gray-100 mb-2 gap-2">
                <span>OrderId : <span class="text-gray-700">#${order._id}</span></span>
                <span>Payment: <span class="text-gray-700">${order.paymentType}</span></span>
                <span>Total Amount: <span class="text-[var(--primary)]">${CURRENCY} ${order.amount}</span></span>
            </div>
            ${itemsHtml}
        `;

        container.appendChild(orderCard);
    });
}