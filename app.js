document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        // 1. Send request to FastAPI
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // 2. Store JWT in LocalStorage (as per flow requirement)
            localStorage.setItem('token', data.access_token);
            
            // 3. Redirect to Feed
            window.location.href = '/feed.html'; 
        } else {
            errorMsg.textContent = data.detail || "Login failed";
            errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error:", error);
        errorMsg.textContent = "Server error. Please try again.";
        errorMsg.classList.remove('hidden');
    }
});