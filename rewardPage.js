document.getElementById("fetchScore").addEventListener("click", async () => {
    const username = localStorage.getItem("username");

    if (!username) {
        alert("Please enter a username!");
        return;
    }

    document.getElementById("username").value = username; // ✅ Set input field AFTER checking

    try {
        const response = await fetch(`http://localhost:5000/get-user-score/${username}`);
        
        if (!response.ok) {
            throw new Error(`⚠ Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Reward Data:", data);
        console.log("Message from server:", data.message); // ✅ Log message for debugging

        // ✅ Update UI with Earned Points
        document.getElementById("earnedPoints").textContent = data.score;

        const rewardImage = document.getElementById("rewardImage");
        const rewardMessage = document.getElementById("rewardMessage");

        // ✅ Reset previous messages & UI
        rewardMessage.textContent = "";
        rewardImage.style.display = "none";

        // ✅ Case: Less than 50 points
        if (data.message && data.message.includes("⚠ You need at least 50 points")) {
            rewardMessage.textContent = "⚠ You need at least 50 points to redeem a coupon.";
            rewardMessage.style.color = "orange";
            return;
        }

        // ✅ Case: Coupon already redeemed
        if (data.message && data.message.includes("Coupon already redeemed")) {
            rewardMessage.textContent = "🎟 Coupon already redeemed!";
            rewardMessage.style.color = "red";
            return;
        }

        // ✅ Case: No coupon available
        if (!data.couponImage) {
            rewardMessage.textContent = "No rewards available.";
            rewardMessage.style.color = "gray";
            return;
        }

        // ✅ Case: Coupon available - Show image
        rewardMessage.textContent = "🎉 You have earned a reward!";
        rewardMessage.style.color = "green";
        rewardImage.src = data.couponImage;
        rewardImage.style.display = "block";

    } catch (error) {
        console.error("❌ Error fetching rewards:", error);
        alert("Error fetching rewards. Please try again later.");
    }
});