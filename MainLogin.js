// ✅ Dynamic BASE_URL for local vs production
const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ecoswap-4vyd.onrender.com";

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form reload

    let isValid = true;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const userType = document.getElementById("userType").value;

    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");
    const userTypeError = document.getElementById("roleError");

    // Hide previous errors
    if (usernameError) usernameError.style.display = "none";
    if (passwordError) passwordError.style.display = "none";
    if (userTypeError) userTypeError.style.display = "none";

    // Validation
    if (!username) {
        if (usernameError) usernameError.style.display = "block";
        isValid = false;
    }

    if (password.length < 6) {
        if (passwordError) passwordError.style.display = "block";
        isValid = false;
    }

    if (!userType) {
        if (userTypeError) userTypeError.style.display = "block";
        isValid = false;
    }

    if (!isValid) return;

    // ✅ Send Login Request
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, userType }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login Successful!");
            const loginTime = Date.now();
            const tokenTTL = 3600 * 1000; // 1 hour

            localStorage.setItem("username", username);
            if (data.token) {
                localStorage.setItem("access_token", data.token);
                localStorage.setItem("login_time", loginTime);
                localStorage.setItem("token_expiry", tokenTTL);
                console.log("✅ Token stored:", data.token);
            } else {
                console.error("❌ No token received from backend");
            }

            // Redirect user
            if (data.type === "customer") {
                window.location.href = "CustLanding.html";
            } else if (data.type === "scrap_collector") {
                window.location.href = "ScrapLanding.html";
            } else if (data.type === "business") {
                window.location.href = "BusLanding.html";
            } else {
                alert("Invalid user type. Please contact support.");
            }
        } else {
            alert(data.error || "Login Failed!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again later.");
    }
});

// ✅ Signup Button Logic
document.getElementById("signupBtn").addEventListener("click", function () {
    const selectedRole = document.getElementById("signupRole").value;

    if (selectedRole === "customer") {
        window.location.href = "CusSign.html";
    } else if (selectedRole === "business") {
        window.location.href = "BusSign.html";
    } else if (selectedRole === "scrap_collector") {
        window.location.href = "ScrapSign.html";
    } else {
        alert("Please select a role to sign up.");
    }
});
