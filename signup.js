document.getElementById("signupForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const identifier = document.getElementById("signupIdentifier").value;
    const password = document.getElementById("signupPassword").value;
    const errorMsg = document.getElementById("signup-error");

    try {
        const response = await fetch("http://127.0.0.1:8000/signup", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.textContent = data.detail || "You already have an account";
            errorMsg.classList.remove("hidden");
            return;
        }

        alert("Signup successful! Please login.");
        window.location.href = "index.html";

    } catch (err) {
        errorMsg.textContent = "Server error. Try again later.";
        errorMsg.classList.remove("hidden");
    }
});
