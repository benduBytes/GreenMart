// js/seller.js

// --- 1. IMAGE PREVIEW LOGIC ---
// This handles multiple image slots (preview1, preview2, etc.)
function previewImage(event, previewId) {
    const reader = new FileReader();
    reader.onload = function(){
        const output = document.getElementById(previewId);
        output.src = reader.result;
    };
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// --- 2. ADD PRODUCT LOGIC (Updated to capture data) ---
function handleAddProduct(e) {
    e.preventDefault(); // Stop page reload

    // 1. Grab values directly from the HTML inputs using their IDs
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const category = document.getElementById('category').value;
    const price = document.getElementById('product-price').value;
    const offerPrice = document.getElementById('offer-price').value;
    
    // 2. Grab the files (images)
    const image1 = document.getElementById('image1').files[0];
    const image2 = document.getElementById('image2').files[0];
    const image3 = document.getElementById('image3').files[0];
    const image4 = document.getElementById('image4').files[0];

    // 3. Validation (Optional but recommended)
    if (!name || !price || !category) {
        alert("Please fill in all required fields");
        return;
    }

    // 4. Log the data to Console (To verify it works)
    console.log("New Product Data:");
    console.log("Name:", name);
    console.log("Description:", description);
    console.log("Category:", category);
    console.log("Price:", price);
    console.log("Offer Price:", offerPrice);
    console.log("Images:", [image1, image2, image3, image4]);

    // 5. Success Message
    alert(`Successfully added product: ${name}`);

    // 6. Reset Form & Images
    e.target.reset();
    ['preview1', 'preview2', 'preview3', 'preview4'].forEach(id => {
        document.getElementById(id).src = 'assets/upload_area.png';
    });
}

// --- 3. NAVIGATION LOGIC ---
// Updates URL hash and switches visible content
function switchView(viewName) {
    window.location.hash = viewName;
}

function updateUI(viewName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    
    // Reset Sidebar styles
    document.querySelectorAll('.sidebar-link').forEach(el => {
        el.classList.remove('active', 'bg-[var(--primary)]/10', 'border-[var(--primary)]', 'text-[var(--primary)]');
        el.classList.add('hover:bg-gray-100/90', 'border-transparent', 'text-gray-700');
    });

    // Show active section
    // If viewName doesn't exist, default to 'add'
    const activeSection = document.getElementById(`view-${viewName}`) || document.getElementById('view-add');
    activeSection.classList.add('active');
    
    // Highlight sidebar
    const navItem = document.getElementById(`nav-${viewName}`);
    if (navItem) {
        navItem.classList.remove('hover:bg-gray-100/90', 'border-transparent', 'text-gray-700');
        navItem.classList.add('active', 'bg-[var(--primary)]/10', 'border-[var(--primary)]', 'text-[var(--primary)]');
    }
}

// Listen for URL changes
window.addEventListener('hashchange', () => {
    updateUI(window.location.hash.replace('#', '') || 'add');
});

// Handle initial load
window.addEventListener('load', () => {
    updateUI(window.location.hash.replace('#', '') || 'add');
});

// --- 4. LOGOUT LOGIC ---
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("isSeller");
        window.location.href = "seller-login.html";
    });
}