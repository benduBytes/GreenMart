// js/seller.js

// --- 1. IMAGE PREVIEW ---
function previewImage(event, previewId) {
    const reader = new FileReader();
    reader.onload = function(){
        document.getElementById(previewId).src = reader.result;
    };
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// --- 2. ADD PRODUCT ---
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('product-name').value;
    alert(`Successfully added product: ${name}`);
    e.target.reset();
    
    // Reset images
    ['preview1', 'preview2', 'preview3', 'preview4'].forEach(id => {
        document.getElementById(id).src = 'assets/upload_area.png';
    });
}

// --- 3. RENDER PRODUCT LIST (With Toggle Switch) ---
function renderProductList() {
    try {
        const tableBody = document.getElementById('product-table-body');
        if (!tableBody) return;
        
        if (typeof products === 'undefined') {
            tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error: Product Data Not Found</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        products.forEach((product) => {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-500/20 hover:bg-gray-50/50 transition";
            
            const imgSrc = Array.isArray(product.image) ? product.image[0] : product.image;

            row.innerHTML = `
                <td class="px-4 py-3 flex items-center gap-3">
                    <div class="border border-gray-300 rounded overflow-hidden w-12 h-12 shrink-0 bg-gray-100">
                        <img src="${imgSrc}" onerror="this.src='assets/upload_area.png'" alt="${product.name}" class="w-full h-full object-cover">
                    </div>
                    <span class="truncate font-medium text-gray-900">${product.name}</span>
                </td>
                <td class="px-4 py-3">${product.category}</td>
                <td class="px-4 py-3 max-sm:hidden">₹${product.offerPrice}</td>
                
                <td class="px-4 py-3 text-center">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${product.inStock ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                    peer-checked:after:translate-x-full peer-checked:after:border-white 
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:border-gray-300 after:border after:rounded-full 
                                    after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]">
                        </div>
                    </label>
                </td>

                <td class="px-4 py-3 text-center">
                    <button class="text-gray-400 hover:text-red-500 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error rendering product list:", error);
    }
}

// --- 4. RENDER ORDERS LIST ---
function renderOrders() {
    try {
        const container = document.getElementById('orders-container');
        if (!container) return;

        if (typeof dummyOrders === 'undefined') {
            container.innerHTML = '<p class="text-center text-red-500">Error: Order Data Not Found.</p>';
            return;
        }

        container.innerHTML = '';

        dummyOrders.forEach((order) => {
            const productSummary = order.items.map(item => {
                const pName = item.product ? item.product.name : "Unknown Item";
                return `${pName} <span class="text-[var(--primary)] font-bold text-xs ml-1">x ${item.quantity}</span>`;
            }).join('<br>');
            
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Just now";

            const card = document.createElement('div');
            card.className = "flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center gap-5 p-5 max-w-4xl rounded-md border border-gray-300 text-gray-800 bg-white hover:shadow-sm transition";

            card.innerHTML = `
                <div class="flex gap-5 items-start">
                    <img class="w-10 h-10 object-contain opacity-70" src="assets/box_icon.svg" alt="box" onerror="this.style.display='none'">
                    <div class="flex flex-col justify-center text-sm"><p class="font-medium">${productSummary}</p></div>
                </div>
                <div class="text-sm">
                    <p class="font-medium mb-1">${order.address.firstName} ${order.address.lastName}</p>
                    <p class="text-gray-600">${order.address.city}, ${order.address.zipcode}</p>
                </div>
                <p class="font-medium text-base my-auto text-gray-700">₹${order.amount}</p>
                <div class="flex flex-col text-sm text-gray-600 gap-1">
                    <p><span class="font-medium">Method:</span> ${order.paymentType}</p>
                    <p><span class="font-medium">Date:</span> ${dateStr}</p>
                    <p class="${order.isPaid ? 'text-green-600' : 'text-orange-500'} font-medium border px-2 py-0.5 rounded w-fit text-xs mt-1">
                        ${order.isPaid ? 'Paid' : 'Pending'}
                    </p>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error rendering orders:", error);
    }
}

// --- 5. NAVIGATION & INIT ---
function switchView(viewName) {
    window.location.hash = viewName;
}

function updateUI(viewName) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(el => {
        el.classList.remove('active', 'bg-[var(--primary)]/10', 'border-[var(--primary)]', 'text-[var(--primary)]');
        el.classList.add('hover:bg-gray-100/90', 'border-transparent', 'text-gray-700');
    });

    const activeSection = document.getElementById(`view-${viewName}`) || document.getElementById('view-add');
    if(activeSection) activeSection.classList.add('active');
    
    const navItem = document.getElementById(`nav-${viewName}`);
    if (navItem) {
        navItem.classList.remove('hover:bg-gray-100/90', 'border-transparent', 'text-gray-700');
        navItem.classList.add('active', 'bg-[var(--primary)]/10', 'border-[var(--primary)]', 'text-[var(--primary)]');
    }

    if (viewName === 'list') renderProductList();
    else if (viewName === 'orders') renderOrders();
}

window.addEventListener('hashchange', () => updateUI(window.location.hash.replace('#', '') || 'add'));
window.addEventListener('load', () => updateUI(window.location.hash.replace('#', '') || 'add'));

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) logoutBtn.addEventListener("click", () => { localStorage.removeItem("isSeller"); window.location.href = "seller-login.html"; });