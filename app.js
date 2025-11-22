document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            window.location.href = 'feed.html';
        }
        if (!response.ok) {
            errorMsg.textContent = data.detail || "Login failed";
            errorMsg.classList.remove('hidden');
            return;
        }

    } catch (error) {
        console.error("Error:", error);
        errorMsg.textContent = "Server error. Please try again.";
        errorMsg.classList.remove('hidden');
    }
});
