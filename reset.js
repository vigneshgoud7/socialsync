document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const new_password = document.getElementById("newPassword").value.trim();
    const email = new URLSearchParams(window.location.search).get("email");

    const errorMsg = document.getElementById("r-error");
    const successMsg = document.getElementById("r-success");

    errorMsg.classList.add("hidden");
    successMsg.classList.add("hidden");

    if (!new_password) {
        errorMsg.textContent = "Enter a new password";
        errorMsg.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/reset-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, new_password })
        });

        let data = {};
        try { data = await response.json(); } catch {}

        if (!response.ok) {
            errorMsg.textContent = data.detail || "Password update failed";
            errorMsg.classList.remove("hidden");
            return;
        }

        successMsg.textContent = "Password updated! Redirecting...";
        successMsg.classList.remove("hidden");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch {
        errorMsg.textContent = "Server error";
        errorMsg.classList.remove("hidden");
    }
});
