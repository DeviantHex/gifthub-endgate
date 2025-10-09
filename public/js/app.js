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
        showNuclearError('Missing access token. Please return to the security gateway.');
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
            // Token is invalid - NUCLEAR: Show error and block completely
            console.log('❌ Token invalid:', result.reason);
            showNuclearError('Invalid or expired token: ' + result.reason);
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
        
        // Show error after a delay
        setTimeout(() => {
            showNuclearError('Token validation service unavailable. Please try again.');
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
            showNuclearError('Session expired during submission. Please return to security gateway.');
            localStorage.removeItem('secureToken');
            localStorage.removeItem('tokenExpiry');
            return;
        }
    } catch (error) {
        showNuclearError('Token validation failed during submission.');
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
