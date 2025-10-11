// Global cart object and utility variables
// ตัวแปรส่วนกลางสำหรับตะกร้าสินค้าและค่าที่จำเป็น
let cart = {};
let currentMenuItem = null;
let currentSlide = 0; 
let carouselInterval; 

// 🔴 Key ที่ใช้สำหรับ LocalStorage: ถูกเปลี่ยนกลับเป็นชื่อเดิม
const CART_STORAGE_KEY = 'chilliLimeCart'; 

// Load cart data from localStorage
// ฟังก์ชันสำหรับโหลดข้อมูลตะกร้าสินค้าจาก LocalStorage เมื่อเริ่มต้น
const loadCart = () => {
    try {
        // 🔴 โหลดข้อมูลจาก Key เดิม
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        // หากมีข้อมูลอยู่ ให้แปลงจาก JSON string เป็น Object มิฉะนั้นให้เป็น Object ว่าง
        cart = storedCart ? JSON.parse(storedCart) : {};
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดตะกร้าจาก localStorage:", error);
        cart = {};
    }
};

// Save cart data to localStorage
// ฟังก์ชันสำหรับบันทึกข้อมูลตะกร้าสินค้าลงใน LocalStorage
const saveCart = () => {
    try {
        // 🔴 บันทึกข้อมูลลงใน Key เดิม
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการบันทึกตะกร้าลง localStorage:", error);
    }
    // 🟢 แก้ไข: เรียก renderCart() ก็ต่อเมื่อมี Element ของ Cart Sidebar อยู่เท่านั้น
    if (document.getElementById('cart-items')) {
        renderCart(); 
    }
};

// Render the cart items in the sidebar
// ฟังก์ชันสำหรับแสดงผลรายการสินค้าในตะกร้าด้านข้าง (Cart Sidebar)
const renderCart = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.querySelector('.cart-count'); 
    const cartCountTextElement = document.getElementById('cart-count-text'); 
    let total = 0;
    let itemCount = 0;
    
    // 🟢 บรรทัดนี้คือบรรทัดที่เคยเกิด Error (script.js:47) แต่ถูกแก้แล้วด้วยเงื่อนไขใน saveCart()
    cartItemsContainer.innerHTML = ''; 

    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #6c757d; margin-top: 20px;">ตะกร้าสินค้าว่างเปล่า</p>';
    }

    for (const itemKey in cart) { 
        const item = cart[itemKey]; 
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        // ดึงรายละเอียดการปรับแต่งเพื่อแสดงในตะกร้า
        let customDetails = '';
        if (item.customization) {
            const customizations = [];
            if (item.customization.spiciness) customizations.push(`เผ็ด: ${item.customization.spiciness}`);
            if (item.customization.addons && item.customization.addons.length > 0) customizations.push(`เพิ่ม: ${item.customization.addons.join(', ')}`);
            if (item.customization.sweetness) customizations.push(`หวาน: ${item.customization.sweetness}`); 
            if (item.customization.topping && item.customization.topping.length > 0) customizations.push(`ท็อปปิ้ง: ${item.customization.topping.join(', ')}`);
            if (item.customization.temp) customizations.push(`อุณหภูมิ: ${item.customization.temp}`);
            if (item.customization.notes) customizations.push(`*หมายเหตุ: ${item.customization.notes}`);

            customDetails = customizations.length > 0 ? `<small class="cart-custom-details">${customizations.join(' | ')}</small>` : '';
        }

        // การเข้ารหัส Key เพื่อให้ปลอดภัยในการส่งผ่าน onclick
        const safeItemKey = encodeURIComponent(itemKey);

        const cartItemHTML = `
            <div class="cart-item">
                <div class="item-details">
                    <span class="item-title">${item.quantity} x ${item.title}</span>
                    <span class="item-price">${itemTotal.toFixed(2)} THB</span>
                    ${customDetails}
                </div>
                <div class="item-actions">
                    <button class="btn-qty" onclick="updateCartQuantity('${safeItemKey}', -1)">-</button>
                    <button class="btn-qty" onclick="updateCartQuantity('${safeItemKey}', 1)">+</button>
                    <button class="btn-remove" onclick="removeFromCart('${safeItemKey}')"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
    }

    cartTotalElement.textContent = total.toFixed(2) + " THB";
    cartCountElement.textContent = itemCount;
    cartCountTextElement.textContent = `(${itemCount} ชิ้น)`;
};

// อัปเดตจำนวนสินค้า (รับ Key ที่ถูก Encode)
const updateCartQuantity = (encodedTitle, change) => {
    // ถอดรหัส Key กลับคืน
    const itemKey = decodeURIComponent(encodedTitle);
    
    if (cart[itemKey]) { 
        cart[itemKey].quantity += change;
        if (cart[itemKey].quantity <= 0) {
            // ส่ง Key ที่ Encode แล้วไปที่ removeFromCart
            removeFromCart(encodedTitle); 
        } else {
            saveCart();
        }
    }
};

// ลบสินค้าออกจากตะกร้าทั้งหมด (รับ Key ที่ถูก Encode)
const removeFromCart = (encodedTitle) => {
    // ถอดรหัส Key กลับคืน
    const itemKey = decodeURIComponent(encodedTitle);
    
    delete cart[itemKey];
    saveCart();
};

// Show a temporary message (Toast)
const showToast = (message) => {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// --- Customization Modal Logic ---
const openCustomization = (button) => {
    const itemElement = button.closest('.menu-item');
    const title = itemElement.querySelector('h3').textContent;
    const priceText = itemElement.querySelector('.price').textContent;
    const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
    const category = itemElement.getAttribute('data-category');

    currentMenuItem = { title, price, category };

    document.getElementById('modal-item-title').textContent = title;
    document.getElementById('modal-item-price').textContent = priceText;
    document.getElementById('modal-item-category').value = category;
    document.getElementById('modal-original-price').value = price;
    document.getElementById('modal-quantity').textContent = 1;
    document.getElementById('modal-final-price').textContent = price.toFixed(2) + " THB";

    document.getElementById('customizationForm').reset();
    document.getElementById('special-notes').value = ''; 

    const isFood = category === 'อาหาร'; 
    const isDrink = category === 'เครื่องดื่ม'; 
    
    document.getElementById('group-food').style.display = isFood ? 'block' : 'none';
    document.getElementById('group-drink').style.display = isDrink ? 'block' : 'none';
    document.getElementById('group-temp').style.display = isDrink ? 'block' : 'none';
    document.getElementById('group-note').style.display = 'block';

    document.getElementById('customizationForm').onchange = calculateFinalPrice;
    calculateFinalPrice(); 

    document.getElementById('customizationModal').style.display = 'flex';
};

const closeCustomization = () => {
    document.getElementById('customizationModal').style.display = 'none';
    document.getElementById('customizationForm').onchange = null;
    currentMenuItem = null;
};

const changeModalQuantity = (change) => {
    const quantityEl = document.getElementById('modal-quantity');
    let currentQty = parseInt(quantityEl.textContent);
    currentQty = Math.max(1, currentQty + change);
    quantityEl.textContent = currentQty;
    calculateFinalPrice();
};

const calculateFinalPrice = () => {
    if (!currentMenuItem) return;

    let basePrice = currentMenuItem.price;
    const quantity = parseInt(document.getElementById('modal-quantity').textContent);
    
    const form = document.getElementById('customizationForm');
    form.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(input => {
        const priceAttr = input.getAttribute('data-price');
        if (priceAttr) {
            basePrice += parseFloat(priceAttr);
        }
    });

    const finalPrice = basePrice * quantity;
    document.getElementById('modal-final-price').textContent = finalPrice.toFixed(2) + " THB";
};

// ฟังก์ชันยืนยันการเพิ่มสินค้าพร้อมการปรับแต่งลงในตะกร้า
const confirmAddToCart = () => {
    if (!currentMenuItem) return;

    const form = document.getElementById('customizationForm');
    const category = currentMenuItem.category;

    const customization = {};

    if (category === 'อาหาร') {
        customization.spiciness = form.querySelector('input[name="spiciness"]:checked')?.value;
        const addons = Array.from(form.querySelectorAll('input[name="addon"]:checked')).map(input => input.value);
        if (addons.length > 0) customization.addons = addons;
    }
    
    if (category === 'เครื่องดื่ม') {
        customization.sweetness = form.querySelector('input[name="sweetness"]:checked')?.value;
        const toppings = Array.from(form.querySelectorAll('input[name="topping"]:checked')).map(input => input.value);
        if (toppings.length > 0) customization.topping = toppings;

        const temp = form.querySelector('input[name="temp"]:checked')?.value;
        if (temp) customization.temp = temp;
    }

    const notes = document.getElementById('special-notes').value.trim();
    if (notes) customization.notes = notes;

    // สร้าง Key สำหรับรายการสินค้าโดยรวมชื่อเมนูและการปรับแต่ง (JSON string)
    const customizationKey = JSON.stringify(customization);
    const itemKey = `${currentMenuItem.title}-${customizationKey}`; 

    const quantity = parseInt(document.getElementById('modal-quantity').textContent);
    const itemPrice = parseFloat(document.getElementById('modal-final-price').textContent.replace(/[^\d.]/g, '')) / quantity;

    if (cart[itemKey]) {
        // ถ้ารายการสินค้าและการปรับแต่งเหมือนเดิม ให้อัปเดตจำนวน
        cart[itemKey].quantity += quantity;
    } else {
        // ถ้ารายการใหม่ ให้เพิ่มลงในตะกร้า
        cart[itemKey] = {
            title: currentMenuItem.title, 
            price: itemPrice,
            quantity: quantity,
            customization: customization 
        };
    }

    saveCart();
    showToast(`✅ เพิ่ม ${quantity}x ${currentMenuItem.title} ลงในตะกร้าแล้ว!`);
    closeCustomization();
};

// --- Filtering and Search Logic ---
const filterMenu = (category, button) => {
    const allItems = document.querySelectorAll('.menu-item');
    const allButtons = document.querySelectorAll('.category-btn');

    allButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    allItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        const isHidden = (category !== 'ขายดี' && itemCategory !== category) || 
                         (category === 'ขายดี' && (itemCategory === 'เครื่องดื่ม' || itemCategory === 'ของหวาน'));

        item.style.display = isHidden ? 'none' : 'block';
    });
};

const searchMenu = () => {
    const query = document.getElementById('menu-search-input').value.toLowerCase();
    const allItems = document.querySelectorAll('.menu-item');
    const allButtons = document.querySelectorAll('.category-btn');
    
    allButtons.forEach(btn => btn.classList.remove('active'));

    allItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        
        const isMatch = title.includes(query) || description.includes(query);
        item.style.display = isMatch ? 'block' : 'none';
    });
};

const showInfoPage = (pageName) => {
    if (pageName === 'ตะกร้าสินค้า') {
        const sidebar = document.querySelector('.cart-sidebar');
        // เลื่อนไปยังตะกร้าสินค้า
        sidebar.scrollIntoView({ behavior: 'smooth' });
    } else if (pageName === 'หน้าหลัก') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert(`🚧 หน้า "${pageName}" ยังอยู่ระหว่างการพัฒนา`);
    }
};

// ฟังก์ชันนำไปยังหน้าชำระเงิน
const goToCheckout = () => {
    if (Object.keys(cart).length === 0) {
        showToast("⚠️ กรุณาเพิ่มสินค้าลงในตะกร้าก่อนทำการสั่งซื้อ");
        return;
    }
    window.location.href = 'checkout.html';
};


// --- FINAL PROJECT REQUIRED FUNCTIONS ---
const initializeVisitorCounter = () => {
    let count = parseInt(localStorage.getItem('visitorCount')) || 0;
    
    // นับจำนวนผู้เยี่ยมชมต่อเซสชัน (ถ้ายังไม่เคยนับในเซสชันนี้)
    if (!sessionStorage.getItem('isSessionVisitor')) {
        count++; 
        localStorage.setItem('visitorCount', count);
        sessionStorage.setItem('isSessionVisitor', 'true');
    }
    
    document.getElementById('visitor-count-display').textContent = count.toLocaleString('en-US');
};

const handleContactFormSubmit = (event) => {
    event.preventDefault();

    const form = event.target;
    const statusEl = document.getElementById('contact-message-status');

    if (!form.checkValidity()) {
        statusEl.textContent = 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง';
        statusEl.style.color = '#ff6347';
        form.reportValidity();
        return;
    }

    const sanitize = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim()
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#39;");
    };

    const name = sanitize(form['contactName'].value);
    const email = sanitize(form['contactEmail'].value);
    const message = sanitize(form['contactMessage'].value);
    
    if (name.length < 3 || message.length < 10) {
        statusEl.textContent = 'ข้อมูลที่ส่งมีปัญหา กรุณาตรวจสอบความยาวชื่อ/ข้อความ';
        statusEl.style.color = '#ff6347';
        return;
    }
    
    console.log("--- CONTACT FORM SUBMITTED (Sanitized) ---");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log("-----------------------------------------");

    statusEl.textContent = '✅ ขอบคุณสำหรับข้อความของคุณ เราจะติดต่อกลับโดยเร็วที่สุด!';
    statusEl.style.color = '#28a745';

    form.reset(); 
    
    setTimeout(() => {
        statusEl.textContent = '';
    }, 5000); 
};

// --- Carousel Logic ---
const slides = [
    { 
        title: 'อร่อยจัดจ้าน', 
        subtitle: 'รับส่วนลด 30% สำหรับการสั่งครั้งแรก!', 
        image: 'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_auto/4212483/123575_475462.jpeg' 
    }
];

const setupCarousel = () => {
    const inner = document.getElementById('carousel-inner');
    const indicatorsContainer = document.getElementById('carousel-indicators');

    inner.innerHTML = ''; 
    indicatorsContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'carousel-slide';
        slideEl.innerHTML = `
            <img src="${slide.image}" alt="${slide.title}">
            <div class="hero-content">
                <h1>${slide.title}</h1>
                <p>${slide.subtitle}</p>
                <button class="btn btn-primary" onclick="filterMenu('ขายดี', document.querySelector('[data-category=\"ขายดี\"]'))">ดูเมนูทั้งหมด</button>
            </div>
        `;
        inner.appendChild(slideEl);
        
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.onclick = () => goToSlide(index);
        indicatorsContainer.appendChild(indicator);
    });

    // เริ่มต้นแสดงสไลด์แรก
    updateCarouselDisplay();
    // ตั้งเวลาเปลี่ยนสไลด์อัตโนมัติ
    startCarouselInterval();
};

const updateCarouselDisplay = () => {
    const inner = document.getElementById('carousel-inner');
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    
    // 🟢 ตรวจสอบว่ามี element ลูกหรือไม่ก่อนเข้าถึง clientWidth
    const slideWidth = inner.children[0] ? inner.children[0].clientWidth : 0; 
    inner.style.transform = `translateX(${-currentSlide * slideWidth}px)`;

    indicators.forEach((indicator, index) => {
        indicator.classList.remove('active');
        if (index === currentSlide) {
            indicator.classList.add('active');
        }
    });
};

const goToSlide = (index) => {
    currentSlide = index;
    updateCarouselDisplay();
    // รีเซ็ตการนับเวลาเมื่อผู้ใช้กดเปลี่ยนสไลด์เอง
    resetCarouselInterval(); 
};

const nextSlide = () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarouselDisplay();
    resetCarouselInterval(); 
};

const prevSlide = () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateCarouselDisplay();
    resetCarouselInterval();
};

const startCarouselInterval = () => {
    if (carouselInterval) clearInterval(carouselInterval);
    // เปลี่ยนสไลด์ทุก 5 วินาที
    carouselInterval = setInterval(nextSlide, 5000); 
};

const resetCarouselInterval = () => {
    startCarouselInterval();
};


// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadCart(); 
    // 🟢 เรียก renderCart() ที่นี่ (เมื่อ Element มีอยู่แล้ว)
    if (document.getElementById('cart-items')) {
        renderCart(); 
    }
    
    // ตั้งค่าตัวกรองเริ่มต้นเป็น "ขายดี"
    const defaultFilterBtn = document.querySelector('[data-category="ขายดี"]');
    if (defaultFilterBtn) {
        filterMenu('ขายดี', defaultFilterBtn);
    }

    initializeVisitorCounter();
    setupCarousel();

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    // อัปเดตการแสดงผลเมื่อปรับขนาดหน้าจอ (สำหรับ Carousel)
    window.addEventListener('resize', updateCarouselDisplay);
});