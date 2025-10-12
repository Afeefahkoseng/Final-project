// ===============================================
// 1. ตัวแปรและฟังก์ชันพื้นฐาน
// ===============================================

const CART_STORAGE_KEY = 'hiwjangCart';
let cart = [];
let currentModalItem = null; // เก็บข้อมูล item ที่กำลังอยู่ใน modal
let modalQuantity = 1; // จำนวนสินค้าเริ่มต้นใน modal

// ===============================================
// 2. ฟังก์ชันจัดการ Local Storage (Cart)
// ===============================================

const saveCart = () => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart to Local Storage:", e);
    }
};

const loadCart = () => {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
        console.error("Error loading cart from Local Storage:", e);
        cart = []; // หากเกิดข้อผิดพลาดให้เริ่มตะกร้าว่าง
    }
};

// ===============================================
// 3. ฟังก์ชันจัดการการแสดงผลตะกร้าสินค้า (Cart Rendering)
// ===============================================

const renderCart = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.querySelector('.cart-count');
    const cartCountTextElement = document.getElementById('cart-count-text');
    
    if (!cartItemsContainer || !cartTotalElement || !cartCountElement || !cartCountTextElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty-message">ตะกร้าสินค้าว่างเปล่า</p>';
    } else {
        cart.forEach((item, index) => {
            const itemPrice = parseFloat(item.finalPrice);
            const subtotal = itemPrice * item.quantity;
            total += subtotal;
            itemCount += item.quantity;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            // สรุป Customization
            let customizationDetails = '';
            if (item.customization) {
                for (const key in item.customization) {
                    if (item.customization[key]) {
                        customizationDetails += `<p class="cart-custom-detail">${item.customization[key]}</p>`;
                    }
                }
            }

            itemElement.innerHTML = `
                <div>
                    <h4 class="cart-item-title">${item.title}</h4>
                    <span class="cart-item-price">${itemPrice.toFixed(2)} THB</span>
                    ${customizationDetails}
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity-controls">
                        <button onclick="changeCartQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeCartQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="cart-remove-btn" onclick="removeItemFromCart(${index})">ลบ</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    cartTotalElement.textContent = `${total.toFixed(2)} THB`;
    cartCountElement.textContent = itemCount;
    cartCountTextElement.textContent = `(${itemCount} ชิ้น)`;
    saveCart();
};

// ===============================================
// 4. ฟังก์ชันจัดการการคลิกในตะกร้าสินค้า
// ===============================================

const changeCartQuantity = (index, delta) => {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            removeItemFromCart(index);
        } else {
            renderCart();
        }
    }
};

const removeItemFromCart = (index) => {
    if (index > -1) {
        cart.splice(index, 1);
        renderCart();
    }
};

const goToCheckout = () => {
    if (cart.length > 0) {
        window.location.href = 'checkout.html';
    } else {
        alert('กรุณาเพิ่มสินค้าลงในตะกร้าก่อนทำการสั่งซื้อ');
    }
};

// ===============================================
// 5. ฟังก์ชันจัดการ Modal Customization
// ===============================================

const getAncestorData = (element, className, dataName) => {
    let current = element;
    while (current) {
        if (current.classList && current.classList.contains(className)) {
            return {
                title: current.querySelector('h3').textContent,
                price: parseFloat(current.querySelector('.price').textContent.replace(' THB', '')),
                category: current.getAttribute('data-category')
            };
        }
        current = current.parentElement;
    }
    return null;
};

const openCustomization = (button) => {
    const itemData = getAncestorData(button, 'menu-item');
    if (!itemData) return;

    currentModalItem = itemData;
    modalQuantity = 1;

    document.getElementById('modal-item-title').textContent = currentModalItem.title;
    document.getElementById('modal-item-price').textContent = `${currentModalItem.price.toFixed(2)} THB`;
    document.getElementById('modal-item-category').value = currentModalItem.category;
    document.getElementById('modal-original-price').value = currentModalItem.price;
    document.getElementById('modal-quantity').textContent = modalQuantity;
    document.getElementById('customizationModal').style.display = 'block';

    // Reset Form
    document.getElementById('customizationForm').reset();
    document.getElementById('special-notes').value = '';

    // Show/Hide Groups based on category
    const isDrink = currentModalItem.category === 'เครื่องดื่ม';
    const isFood = currentModalItem.category === 'อาหาร' || currentModalItem.category === 'ขายดี';
    
    document.getElementById('group-food').style.display = isFood ? 'block' : 'none';
    document.getElementById('group-drink').style.display = isDrink ? 'block' : 'none';
    document.getElementById('group-temp').style.display = isDrink ? 'block' : 'none';

    // Attach event listeners for price update
    document.querySelectorAll('#customizationForm input').forEach(input => {
        input.onchange = calculateFinalPrice;
    });

    calculateFinalPrice();
};

const closeCustomization = () => {
    document.getElementById('customizationModal').style.display = 'none';
    currentModalItem = null;
};

const calculateFinalPrice = () => {
    if (!currentModalItem) return 0;
    
    let basePrice = currentModalItem.price;
    let addonPrice = 0;
    const form = document.getElementById('customizationForm');
    
    // Check all checkbox and radio inputs for price additions
    form.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(input => {
        const priceAttr = input.getAttribute('data-price');
        if (priceAttr) {
            addonPrice += parseFloat(priceAttr);
        }
    });

    const finalPrice = (basePrice + addonPrice) * modalQuantity;
    document.getElementById('modal-final-price').textContent = `${finalPrice.toFixed(2)} THB`;
    return finalPrice;
};

const changeModalQuantity = (delta) => {
    modalQuantity += delta;
    if (modalQuantity < 1) modalQuantity = 1;
    document.getElementById('modal-quantity').textContent = modalQuantity;
    calculateFinalPrice();
};

const confirmAddToCart = () => {
    if (!currentModalItem) return;

    const finalPrice = calculateFinalPrice() / modalQuantity; // Price per unit
    const form = document.getElementById('customizationForm');
    
    // 1. Get Customization Details
    let customization = {};
    const category = currentModalItem.category;

    // Food Customization
    if (category === 'อาหาร' || category === 'ขายดี') {
        customization.spiciness = form.querySelector('input[name="spiciness"]:checked')?.value || 'ปกติ';
        
        const selectedAddons = Array.from(form.querySelectorAll('input[name="addon"]:checked'))
            .map(input => input.value);
        if (selectedAddons.length > 0) {
            customization.addon = selectedAddons.join(', ');
        }
    }

    // Drink Customization
    if (category === 'เครื่องดื่ม') {
        customization.sweetness = form.querySelector('input[name="sweetness"]:checked')?.value || 'ปกติ';
        customization.temp = form.querySelector('input[name="temp"]:checked')?.value || 'เย็น';

        const selectedToppings = Array.from(form.querySelectorAll('input[name="topping"]:checked'))
            .map(input => input.value);
        if (selectedToppings.length > 0) {
            customization.topping = selectedToppings.join(', ');
        }
    }
    
    // Additional Notes
    const notes = document.getElementById('special-notes').value.trim();
    if (notes) {
        customization.note = notes;
    }

    // 2. Add to Cart
    cart.push({
        id: Date.now(), // ใช้เวลาเป็น unique ID
        title: currentModalItem.title,
        quantity: modalQuantity,
        originalPrice: currentModalItem.price,
        finalPrice: finalPrice, // ราคาต่อชิ้นรวม Addon/Option
        customization: customization
    });

    closeCustomization();
    renderCart();
};

// ===============================================
// 6. ฟังก์ชันจัดการเมนูและการค้นหา
// ===============================================

/**
 * * @param {string} category - หมวดหมู่ที่ต้องการกรอง
 * @param {HTMLElement} clickedElement - องค์ประกอบที่ถูกคลิก (button หรือ a)
 */
const filterMenu = (category, clickedElement) => {
    const allItems = document.querySelectorAll('.menu-item');
    const allButtons = document.querySelectorAll('.category-btn');
    
    // 1. จัดการ Active Class
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // ถ้าคลิกจากปุ่มหมวดหมู่ (Button) ให้เพิ่ม active class
    // ถ้าคลิกจากลิงก์ 'เมนู' ใน nav (Anchor/A) ไม่ต้องเพิ่ม active ให้ปุ่มในเมนู
    if (clickedElement && clickedElement.tagName === 'BUTTON') {
        clickedElement.classList.add('active');
    } else {
        // หากคลิกจากลิงก์เมนูหลัก ให้กำหนดปุ่ม 'ขายดี' เป็น Active
        const bestSellerButton = document.querySelector('.category-btn[data-category="ขายดี"]');
        if (bestSellerButton) {
            bestSellerButton.classList.add('active');
        }
    }

    // 2. กรองและแสดงผลเมนู
    allItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        let shouldShow = false;

        if (category === 'ขายดี') {
            // Logic: ขายดีคือ อาหาร (และไม่รวมเครื่องดื่ม/ของหวาน)
            shouldShow = itemCategory === 'อาหาร' || itemCategory === 'ขายดี'; 
        } else {
            // Logic: แสดงเฉพาะหมวดหมู่ที่ตรงกัน
            shouldShow = itemCategory === category;
        }

        item.style.display = shouldShow ? 'block' : 'none';
    });
};


const searchMenu = () => {
    const searchTerm = document.getElementById('menu-search-input').value.toLowerCase();
    const allItems = document.querySelectorAll('.menu-item');

    allItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        
        // ถ้าชื่อหรือคำอธิบายมีคำที่ค้นหาอยู่ ให้แสดง
        const match = title.includes(searchTerm) || description.includes(searchTerm);
        
        item.style.display = match ? 'block' : 'none';
    });
};

// ===============================================
// 7. ฟังก์ชัน Utility อื่น ๆ
// ===============================================

const showInfoPage = (pageName) => {
    alert(`คุณต้องการไปยังหน้า: ${pageName}`);
    // ในการพัฒนาจริง ฟังก์ชันนี้จะนำไปหน้า HTML/Route อื่น ๆ เช่น /cart, /home
    // สำหรับตอนนี้ มันคือการแจ้งเตือนแทนการนำทาง
    if (pageName === 'ตะกร้าสินค้า') {
        // ตรวจสอบว่าตะกร้าสินค้าว่างหรือไม่
        if (cart.length > 0) {
            goToCheckout();
        } else {
            alert('ตะกร้าสินค้าว่างเปล่า ไม่สามารถดำเนินการต่อได้');
        }
    }
};

const handleContactFormSubmit = (event) => {
    event.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const statusElement = document.getElementById('contact-message-status');

    // Simple validation
    if (name && email && message) {
        statusElement.textContent = `ขอบคุณ, ${name}! ข้อความของคุณถูกส่งแล้ว (จำลองการส่ง)`;
        statusElement.style.color = 'green';
        document.getElementById('contactForm').reset();
    } else {
        statusElement.textContent = 'กรุณากรอกข้อมูลให้ครบถ้วน';
        statusElement.style.color = 'red';
    }
};

// ===============================================
// 8. CAROUSEL FUNCTIONALITY
// ===============================================

let slideIndex = 0;
const slidesData = [
    { title: "โปรโมชั่น 10% OFF", text: "ลดทันทีเมื่อสั่งอาหารครบ 300 บาท", image: "https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2023/04/24/5608757681874e1ea5df1aa41d5b2e3d_How_To_Make_Tom_Yam_Kung_The_Epitome_Of_Delicious_And_Nutritious_Thai_Cuisine3.jpg" },
    { title: "เมนูใหม่: ผัดไทยกุ้ง", text: "ห้ามพลาด! เส้นจันท์เหนียวนุ่ม กุ้งตัวโต", image: "https://www.lancakebakery.com/wp-content/uploads/2024/03/ผัดไทยกุ้งสด1.jpg" },
    { title: "อร่อยซ่ากับเครื่องดื่ม", text: "ซื้อ 2 แถม 1 เฉพาะชาเย็นและโกโก้", image: "https://www.hatyaifocus.com/ckeditor/upload/forums/3/Na/5-30%20-64%20ร้านนมสดพี่ปุ๋ย%20แสงทอง/IMG_0349.jpg" }
];

const renderSlides = () => {
    const container = document.getElementById('carousel-inner');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    container.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    slidesData.forEach((slide, index) => {
        // Slide content
        const slideElement = document.createElement('div');
        slideElement.classList.add('carousel-slide');
        slideElement.style.backgroundImage = `url('${slide.image}')`;
        slideElement.innerHTML = `
            <div class="carousel-caption">
                <h3>${slide.title}</h3>
                <p>${slide.text}</p>
            </div>
        `;
        container.appendChild(slideElement);

        // Indicator button
        const indicator = document.createElement('span');
        indicator.classList.add('indicator');
        indicator.onclick = () => currentSlide(index);
        indicatorsContainer.appendChild(indicator);
    });

    showSlides(slideIndex);
};

const showSlides = (n) => {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (slides.length === 0) return;

    if (n >= slides.length) { slideIndex = 0 }
    if (n < 0) { slideIndex = slides.length - 1 }

    slides.forEach((slide, index) => {
        slide.style.display = 'none';
        indicators[index].classList.remove('active');
    });

    slides[slideIndex].style.display = 'block';
    indicators[slideIndex].classList.add('active');
};

const nextSlide = () => {
    showSlides(++slideIndex);
};

const prevSlide = () => {
    showSlides(--slideIndex);
};

const currentSlide = (n) => {
    slideIndex = n;
    showSlides(n);
};

// ตั้งค่าให้สไลด์เปลี่ยนอัตโนมัติทุก 5 วินาที
const startAutoSlide = () => {
    setInterval(nextSlide, 5000);
};


// ===============================================
// 9. VISITOR COUNTER FUNCTIONALITY
// ===============================================

const VISITOR_COUNT_KEY = 'hiwjangVisitorCount';

const initializeVisitorCounter = () => {
    let count = parseInt(localStorage.getItem(VISITOR_COUNT_KEY)) || 0;
    
    // เพิ่มจำนวนนับเฉพาะเมื่อโหลดหน้าใหม่
    count++;
    localStorage.setItem(VISITOR_COUNT_KEY, count);
    
    const displayElement = document.getElementById('visitor-count-display');
    if (displayElement) {
        displayElement.textContent = count.toLocaleString('en-US'); // แสดงตัวเลขแบบมีลูกน้ำ
    }
};

// ===============================================
// 10. INITIALIZATION
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();
    filterMenu('ขายดี', document.querySelector('.category-btn.active')); // แสดงเมนูขายดีเริ่มต้น
    
    // 🟢 โค้ดที่แก้ไขและเพิ่มเข้ามา: จัดการการคลิกที่ลิงก์ 'เมนู' ใน nav bar 
    const navMenuLink = document.querySelector('.main-nav a[onclick^="filterMenu"]');
    if (navMenuLink) {
        navMenuLink.addEventListener('click', (event) => {
            event.preventDefault(); // ป้องกันการกระโดดของลิงก์ #
            // หาปุ่ม 'ขายดี' ในส่วนเมนูเพื่อส่งไปในฟังก์ชัน filterMenu
            const bestSellerButton = document.querySelector('.category-btn[data-category="ขายดี"]');
            
            // เรียกใช้ filterMenu โดยใช้ 'ขายดี' เป็นหมวดหมู่ และส่ง element ที่ถูกคลิก (ลิงก์) ไป
            filterMenu('ขายดี', navMenuLink); 
        });
    }

    // Contact Form Event Listener
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    
    // Initialize
    renderSlides();
    startAutoSlide();
    initializeVisitorCounter();
    
});