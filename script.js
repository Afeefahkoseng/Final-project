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
        // แก้ไข: cart ต้องเป็น Array เมื่อไม่มีข้อมูล เพื่อให้ .length ทำงานได้ถูกต้อง
        cart = storedCart ? JSON.parse(storedCart) : []; 
    } catch (e) {
        console.error("Error loading cart from Local Storage:", e);
        cart = []; // หากเกิดข้อผิดพลาดให้เริ่มตะกร้าว่าง
    }
};

// ===============================================
// 3. ฟังก์ชันจัดการการแสดงผลตะกร้าสินค้า (Cart Rendering)
// ===============================================

/**
 * ฟังก์ชันคำนวณราคารวมทั้งหมดของสินค้าในตะกร้า
 * @returns {number} ราคารวมทั้งหมด
 */
const calculateGrandTotal = () => {
    let grandTotal = 0;
    cart.forEach(item => {
        // **สำคัญ:** ใช้ parseFloat เพื่อให้แน่ใจว่า finalPrice เป็นตัวเลขสำหรับการคำนวณ
        const price = parseFloat(item.finalPrice) || 0; 
        grandTotal += price * item.quantity;
    });
    return grandTotal;
};

const renderCart = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.querySelector('.cart-count');
    const cartCountTextElement = document.getElementById('cart-count-text');
    
    // 🟢 การแก้ไข: ตรวจสอบว่า Element หลักของ index.html มีอยู่หรือไม่
    if (!cartItemsContainer || !cartTotalElement || !cartCountElement || !cartCountTextElement) {
        // ถ้า Element หายไป (แสดงว่าไม่ได้อยู่ใน index.html) ให้ตรวจสอบและเรียกใช้ฟังก์ชันสำหรับ Checkout
        if (document.getElementById('checkout-summary-list')) {
            renderCheckoutCart();
        }
        return;
    }

    // ส่วนนี้จะทำงานเฉพาะเมื่ออยู่ใน index.html เท่านั้น
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty-message">ตะกร้าสินค้าว่างเปล่า</p>';
    } else {
        cart.forEach((item, index) => {
            // **สำคัญ:** ใช้ parseFloat เพื่อให้แน่ใจว่า finalPrice เป็นตัวเลข
            const itemPrice = parseFloat(item.finalPrice) || 0; 
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
                        // ไม่แสดง 'note' ในรายละเอียดสั้น ๆ ของตะกร้าด้านข้าง
                        if (key !== 'note') { 
                            customizationDetails += `<p class="cart-custom-detail">${item.customization[key]}</p>`;
                        }
                    }
                }
            }
            
            // เพิ่มหมายเหตุ (ถ้ามี)
            if (item.customization && item.customization.note) {
                 customizationDetails += `<p class="cart-custom-detail"><i class="fas fa-sticky-note"></i> ${item.customization.note}</p>`;
            }


            itemElement.innerHTML = `
                <div>
                    <h4 class="cart-item-title">${item.title}</h4>
                    <span class="cart-item-price">${itemPrice.toFixed(2)} THB</span>
                    ${customizationDetails}
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity-controls">
                        <button class="btn-qty btn-minus" onclick="changeCartQuantity(${index}, -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="btn-qty btn-plus" onclick="changeCartQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="btn-remove" onclick="removeItemFromCart(${index})"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    // ใช้ calculateGrandTotal() เพื่อคำนวณราคารวมทั้งหมด
    const grandTotal = calculateGrandTotal();

    cartTotalElement.textContent = `${grandTotal.toFixed(2)} THB`;
    cartCountElement.textContent = itemCount;
    cartCountTextElement.textContent = `(${itemCount} ชิ้น)`;
    saveCart();
};

// ===============================================
// 3.1 ฟังก์ชันจัดการการแสดงผลในหน้า Checkout (NEW)
// ===============================================

const renderCheckoutCart = () => {
    const summaryList = document.getElementById('checkout-summary-list');
    const totalAmountElement = document.getElementById('checkout-total-amount');

    if (!summaryList || !totalAmountElement) return;

    summaryList.innerHTML = ''; // ล้างรายการเดิม
    
    if (cart.length === 0) {
        summaryList.innerHTML = '<p class="text-muted" style="text-align: center;">ไม่มีรายการสินค้าในตะกร้า</p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('summary-item'); 
            
            // สรุป Customization สำหรับ Checkout
            let details = [];
            if (item.customization) {
                 for (const key in item.customization) {
                     if (item.customization[key]) {
                        details.push(item.customization[key]);
                     }
                 }
            }
            const detailsHtml = details.length > 0 ? `<span class="summary-customization text-secondary">(${details.join(' | ')})</span>` : '';

            
            // ใช้ item.finalPrice (ราคาต่อชิ้น)
            const itemPrice = parseFloat(item.finalPrice) || 0; 
            const subtotal = itemPrice * item.quantity;
            
            itemElement.innerHTML = `
                <div class="summary-item-details">
                    <span>${item.quantity} x ${item.title}</span>
                    ${detailsHtml}
                </div>
                <div class="summary-item-price">
                    ${subtotal.toFixed(2)} THB
                </div>
            `;
            summaryList.appendChild(itemElement);
        });
    }

    // คำนวณราคารวมทั้งหมด
    const grandTotal = calculateGrandTotal();
    totalAmountElement.textContent = `${grandTotal.toFixed(2)} THB`;
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
            // **แก้ไข:** ทำให้มั่นใจว่าราคาเป็นตัวเลขตั้งแต่ต้น
            const priceText = current.querySelector('.price').textContent.replace(' THB', '').replace(',', '');
            return {
                title: current.querySelector('h3').textContent,
                price: parseFloat(priceText) || 0, // แปลงเป็น float ตั้งแต่ตรงนี้
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
        // **สำคัญ:** ตรวจสอบและแปลง data-price เป็นตัวเลข
        if (priceAttr) {
            addonPrice += parseFloat(priceAttr) || 0;
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

    const finalPricePerUnit = calculateFinalPrice() / modalQuantity; // Price per unit
    const form = document.getElementById('customizationForm');
    
    // 1. Get Customization Details
    let customization = {};
    const category = currentModalItem.category;

    // Food Customization
    if (category === 'อาหาร' || category === 'ขายดี') {
        customization.spiciness = form.querySelector('input[name="spiciness"]:checked')?.value || 'ไม่ระบุ';
        
        const selectedAddons = Array.from(form.querySelectorAll('input[name="addon"]:checked'))
            .map(input => input.value);
        if (selectedAddons.length > 0) {
            customization.addon = selectedAddons.join(', ');
        }
    }

    // Drink Customization
    if (category === 'เครื่องดื่ม') {
        customization.sweetness = form.querySelector('input[name="sweetness"]:checked')?.value || 'ไม่ระระบุ';
        customization.temp = form.querySelector('input[name="temp"]:checked')?.value || 'ไม่ระบุ';

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
        // **สำคัญ:** finalPrice ถูกเก็บเป็นตัวเลข (Float) แล้ว
        finalPrice: finalPricePerUnit, 
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
    if (!container || !indicatorsContainer) return; // เพิ่มการตรวจสอบ

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

    // ซ่อนสไลด์ทั้งหมดก่อน
    const container = document.getElementById('carousel-inner');
    if (container) {
        // ต้องปรับตำแหน่ง transform ให้เป็น percent ของสไลด์ที่ต้องการแสดง
        container.style.transform = `translateX(-${slideIndex * 100}%)`; 
    }

    indicators.forEach((indicator, index) => {
        indicator.classList.remove('active');
        if (index === slideIndex) {
            indicator.classList.add('active');
        }
    });

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
let autoSlideInterval;
const startAutoSlide = () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(nextSlide, 5000);
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
    
    // 🟢 แก้ไข: เรียก renderCart() เพื่อให้ฟังก์ชันมีการตรวจสอบหน้า
    renderCart(); 

    // Initializations ที่เกี่ยวข้องกับ index.html
    const menuSection = document.querySelector('.menu-section');
    if (menuSection) { // ตรวจสอบว่าอยู่ในหน้า index.html หรือไม่
        filterMenu('ขายดี', document.querySelector('.category-btn.active')); // แสดงเมนูขายดีเริ่มต้น
        
        // จัดการการคลิกที่ลิงก์ 'เมนู' ใน nav bar 
        const navMenuLink = document.querySelector('.main-nav a[onclick^="filterMenu"]');
        if (navMenuLink) {
            navMenuLink.addEventListener('click', (event) => {
                event.preventDefault(); // ป้องกันการกระโดดของลิงก์ #
                const bestSellerButton = document.querySelector('.category-btn[data-category="ขายดี"]');
                filterMenu('ขายดี', bestSellerButton); // ให้ปุ่มขายดี Active
            });
        }
        
        // Initialize Carousel และ Counter เฉพาะใน index.html
        renderSlides();
        startAutoSlide();
        initializeVisitorCounter();
    }


    // Contact Form Event Listener
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    
});