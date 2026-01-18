// ------------------ COMPONENTS LOADER ------------------
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

// ------------------ INITIALIZE APP ------------------
document.addEventListener("DOMContentLoaded", () => {
  // 1. Load Navbar, Login, Signup (Attach events after loading)
  loadComponent("navbar-placeholder", "components/navbar.html", attachEvents);
  loadComponent("login-placeholder", "components/login.html", attachEvents);
  loadComponent("signup-placeholder", "components/signup.html", attachEvents);

  // 2. Load Home Banner
  loadComponent("home-placeholder", "components/mainBanner.html", applyBannerLayoutRules);

  // 3. Load Categories (CRITICAL FIX HERE)
  // We pass 'renderCategories' as the callback so it runs AFTER the HTML arrives
  loadComponent("categories-placeholder", "components/categories.html", renderCategories);
});

// ------------------ CATEGORY LOGIC ------------------
function renderCategories() {
  const grid = document.getElementById("categories-grid");
  
  // Safety check
  if (!grid || typeof categories === 'undefined') return;

  grid.innerHTML = "";

  categories.forEach(cat => {
    const div = document.createElement("div");
    
    // --- STYLING FROM REACT CODE ---
    div.className = "group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center hover:shadow-md transition-all";
    div.style.backgroundColor = cat.bgColor;

    div.addEventListener("click", () => {
      window.location.href = `/properties/${cat.path.toLowerCase()}`;
      window.scrollTo(0, 0);
    });

    // --- INNER HTML ---
    div.innerHTML = `
      <img 
        src="${cat.image}" 
        alt="${cat.text}" 
        class="group-hover:scale-110 transition duration-300 max-w-28" 
      />
      <p class="text-sm font-medium text-black/80">${cat.text}</p>
    `;

    grid.appendChild(div);
  });
}

// ------------------ BANNER RULES ------------------
function applyBannerLayoutRules() {
  const banner = document.getElementById("main-banner");
  if (!banner) return;

  const isSellerPath = window.location.pathname.includes("seller");
  if (isSellerPath) {
    banner.classList.remove("banner-padding");
  } else {
    banner.classList.add("banner-padding");
  }
}

// ------------------ GLOBAL VARIABLES ------------------
let loginModal, signupModal, mobileLoginBtn, desktopLoginBtn;
let menuToggle, mobileMenu;

// Safe parsing for local storage
let currentUser = null;
let users = [];
try {
  currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  users = JSON.parse(localStorage.getItem("users")) || [];
} catch (e) {
  console.error("Local storage error:", e);
}

// ------------------ ATTACH EVENTS ------------------
// This runs every time a component finishes loading
function attachEvents() {
  // Modals
  loginModal = document.getElementById("login-modal");
  signupModal = document.getElementById("signup-modal");

  // Mobile menu
  menuToggle = document.getElementById("menu-toggle");
  mobileMenu = document.getElementById("mobile-menu");

  if (menuToggle && mobileMenu) {
    // Clone node to prevent duplicate event listeners if attached multiple times
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

  // Buttons
  mobileLoginBtn = document.getElementById("mobile-login-btn");
  desktopLoginBtn = document.getElementById("desktop-login-btn");

  updateAuthButtons();
  setupForms();
}

// ------------------ MODAL HELPERS (Global) ------------------
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

// ------------------ AUTH BUTTONS ------------------
function updateAuthButtons() {
  const isLoggedIn = currentUser !== null;
  const loginText = isLoggedIn ? "Logout" : "Login";
  const loginColor = isLoggedIn ? "bg-red-500" : "bg-indigo-500";

  [mobileLoginBtn, desktopLoginBtn].forEach(btn => {
    if (!btn) return;
    btn.textContent = loginText;
    btn.classList.remove("bg-red-500", "bg-indigo-500");
    btn.classList.add(loginColor);

    // Remove old listeners by cloning (simple way to reset events)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
      if (isLoggedIn) {
        currentUser = null;
        localStorage.removeItem("currentUser");
        // Reload page to refresh state or just update UI
        location.reload(); 
      } else {
        window.openLogin();
      }
    };
  });
}

// ------------------ FORMS ------------------
function setupForms() {
  if (!loginModal || !signupModal) return;

  const loginForm = loginModal.querySelector("form");
  const signupForm = signupModal.querySelector("form");

  if (loginForm) {
    // Clone to prevent duplicate listeners
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
      location.reload(); // Reload to update UI everywhere
    });
  }

  if (signupForm) {
     // Clone to prevent duplicate listeners
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