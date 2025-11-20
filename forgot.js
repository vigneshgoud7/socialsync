document.getElementById("forgotForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("fpEmail").value.trim();
    const errorMsg = document.getElementById("fp-error");
    const successMsg = document.getElementById("fp-success");

    errorMsg.classList.add("hidden");
    successMsg.classList.add("hidden");

    if (!email) {
        errorMsg.textContent = "Please enter your email";
        errorMsg.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })  // ✅ SUPER IMPORTANT!
        });

        let data = {};
        try { data = await response.json(); } catch {}

        if (!response.ok) {
            errorMsg.textContent = data.detail || "Error sending OTP";
            errorMsg.classList.remove("hidden");
            return;
        }

        successMsg.textContent = "OTP sent to your email!";
        successMsg.classList.remove("hidden");

        setTimeout(() => {
            window.location.href = "verify.html?email=" + email;
        }, 1500);

    } catch (err) {
        errorMsg.textContent = "Server error";
        errorMsg.classList.remove("hidden");
    }
});
