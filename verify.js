document.getElementById("verifyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = Number(document.getElementById("otp").value);
    const email = new URLSearchParams(window.location.search).get("email");

    const errorMsg = document.getElementById("v-error");
    const successMsg = document.getElementById("v-success");

    errorMsg.classList.add("hidden");
    successMsg.classList.add("hidden");

    try {
        const response = await fetch("http://127.0.0.1:8000/verify-otp", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, otp })
        });

        let data = {};
        try { data = await response.json(); } catch {}

        if (!response.ok) {
            errorMsg.textContent = data.detail || "Invalid OTP";
            errorMsg.classList.remove("hidden");
            return;
        }

        successMsg.textContent = "OTP Verified! Redirecting...";
        successMsg.classList.remove("hidden");

        setTimeout(() => {
            window.location.href = "reset.html?email=" + encodeURIComponent(email);
        }, 1500);

    } catch (err) {
        errorMsg.textContent = "Server error";
        errorMsg.classList.remove("hidden");
    }
});
