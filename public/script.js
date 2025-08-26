// DOM elements
const pollForm = document.getElementById('pollForm');
const optionsContainer = document.getElementById('optionsContainer');
const addOptionBtn = document.getElementById('addOption');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum datetime to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('deadline').min = now.toISOString().slice(0, 16);
    
    updateRemoveButtons();
});

// Add option functionality
addOptionBtn.addEventListener('click', function() {
    const optionCount = optionsContainer.children.length;
    if (optionCount >= 10) {
        showError('Maximum 10 options allowed');
        return;
    }
    
    const newOption = document.createElement('div');
    newOption.className = 'option-input';
    newOption.innerHTML = `
        <input type="text" name="option" placeholder="Option ${optionCount + 1}" required maxlength="100">
        <button type="button" class="remove-option">×</button>
    `;
    
    optionsContainer.appendChild(newOption);
    updateRemoveButtons();
    
    // Focus on the new input
    newOption.querySelector('input').focus();
});

// Remove option functionality
optionsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-option')) {
        const optionInput = e.target.parentElement;
        optionInput.remove();
        updateRemoveButtons();
        updateOptionPlaceholders();
    }
});

// Update remove button visibility
function updateRemoveButtons() {
    const options = optionsContainer.children;
    const showRemoveButtons = options.length > 2;
    
    Array.from(options).forEach(option => {
        const removeBtn = option.querySelector('.remove-option');
        removeBtn.style.display = showRemoveButtons ? 'flex' : 'none';
    });
}

// Update option placeholders
function updateOptionPlaceholders() {
    const options = optionsContainer.children;
    Array.from(options).forEach((option, index) => {
        const input = option.querySelector('input');
        input.placeholder = `Option ${index + 1}`;
    });
}

// Form submission
pollForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    hideError();
    hideResult();
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Poll...';
    
    try {
        // Collect form data
        const formData = new FormData(pollForm);
        const title = formData.get('title').trim();
        const description = formData.get('description').trim();
        const deadline = formData.get('deadline');
        
        // Get all options
        const optionInputs = optionsContainer.querySelectorAll('input[name="option"]');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option.length > 0);
        
        // Validate
        if (!title) {
            throw new Error('Poll title is required');
        }
        
        if (options.length < 2) {
            throw new Error('At least 2 options are required');
        }
        
        // Check for duplicate options
        const uniqueOptions = [...new Set(options)];
        if (uniqueOptions.length !== options.length) {
            throw new Error('Duplicate options are not allowed');
        }
        
        // Validate deadline
        if (deadline && new Date(deadline) <= new Date()) {
            throw new Error('Deadline must be in the future');
        }
        
        // Submit to API
        const response = await fetch('/api/polls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                options: uniqueOptions,
                deadline: deadline || null
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create poll');
        }
        
        // Show success result
        showSuccess(data.pollUrl, data.resultsUrl);
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Poll';
    }
});

// Show success result
function showSuccess(pollUrl, resultsUrl) {
    document.getElementById('pollUrl').value = pollUrl;
    document.getElementById('resultsUrl').value = resultsUrl;
    
    pollForm.style.display = 'none';
    resultDiv.classList.remove('hidden');
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// Show error message
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth' });
}

// Hide error message
function hideError() {
    errorDiv.classList.add('hidden');
}

// Hide result
function hideResult() {
    resultDiv.classList.add('hidden');
}

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    element.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Show feedback
        const button = element.nextElementSibling;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
        showError('Failed to copy to clipboard');
    }
}

// Create another poll
function createAnother() {
    // Reset form
    pollForm.reset();
    
    // Reset options to default 2
    optionsContainer.innerHTML = `
        <div class="option-input">
            <input type="text" name="option" placeholder="Option 1" required maxlength="100">
            <button type="button" class="remove-option" style="display: none;">×</button>
        </div>
        <div class="option-input">
            <input type="text" name="option" placeholder="Option 2" required maxlength="100">
            <button type="button" class="remove-option" style="display: none;">×</button>
        </div>
    `;
    
    // Hide result and show form
    hideResult();
    hideError();
    pollForm.style.display = 'block';
    
    // Focus on title input
    document.getElementById('title').focus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Real-time validation feedback
document.getElementById('title').addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        this.style.borderColor = '#28a745';
    } else {
        this.style.borderColor = '#e1e5e9';
    }
});

// Option input validation
optionsContainer.addEventListener('input', function(e) {
    if (e.target.name === 'option') {
        if (e.target.value.trim().length > 0) {
            e.target.style.borderColor = '#28a745';
        } else {
            e.target.style.borderColor = '#e1e5e9';
        }
    }
});

// Deadline validation
document.getElementById('deadline').addEventListener('change', function() {
    if (this.value && new Date(this.value) <= new Date()) {
        this.style.borderColor = '#dc3545';
        showError('Deadline must be in the future');
    } else {
        this.style.borderColor = '#e1e5e9';
        hideError();
    }
});