document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    // Logout button functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        window.location.href = "MainLogin.html";
    });

    // Initial fetch of claimed listings
    fetchClaimedListings();
});

// Show and hide loading overlay
function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

// Display and clear error messages
function displayError(message) {
    const errorDisplay = document.getElementById("errorDisplay");
    errorDisplay.textContent = message;
    errorDisplay.style.display = "block";
}

function clearError() {
    const errorDisplay = document.getElementById("errorDisplay");
    errorDisplay.textContent = "";
    errorDisplay.style.display = "none";
}

// Fetch only claimed listings
async function fetchClaimedListings() {
    showLoading();
    try {
        const accessToken = localStorage.getItem("access_token");
        const businessUsername = localStorage.getItem("username");

        // Fetch listings from the backend
        const response = await fetch(`http://localhost:5000/listings/business`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let listings = await response.json();
        
        // Filter to include only claimed listings on the frontend (if backend doesn’t filter)
        listings = listings.filter(listing => listing.status === "claimed" && listing.claimed_by);
        
        displayListings(listings, businessUsername);
    } catch (error) {
        console.error("❌ Failed to fetch claimed listings:", error);
        alert("Failed to load claimed listings.");
    } finally {
        hideLoading();
    }
}

// Create listing card (no claim button)
function createListingCard(listing, businessUsername) {
    const card = document.createElement("div");
    card.classList.add("listing-card");

    let imageElement = listing.image_urls && listing.image_urls.length > 0
        ? `<img src="${listing.image_urls[0]}" alt="Waste Image" class="listing-image">`
        : "";

    const isClaimedByCurrentUser = listing.claimed_by === businessUsername;

    card.innerHTML = `
        <div class="card-content">
            ${imageElement}
            <div class="listing-details">
                <h3>${listing.waste_type}</h3>
                <p>${listing.description}</p>
                <p><strong>Condition:</strong> ${listing.condition}</p>
                <p><strong>Location:</strong> ${listing.location_name}</p>
                <p><strong>Posted by:</strong> ${listing.username || "Unknown"}</p>
                <p class="claimed-text">
                    Claimed by: ${listing.claimed_by || "Unknown"}
                    ${isClaimedByCurrentUser ? " (You)" : ""}
                </p>
            </div>
        </div>
    `;

    return card;
}

// Display listings
function displayListings(listings, businessUsername) {
    const listingsContainer = document.getElementById("listingsContainer");
    listingsContainer.innerHTML = "";

    if (listings.length === 0) {
        listingsContainer.innerHTML = "<p>No claimed waste listings found.</p>";
        return;
    }

    listings.forEach(listing => {
        const card = createListingCard(listing, businessUsername);
        listingsContainer.appendChild(card);
    });
}

// Session timeout
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    const loginTime = parseInt(localStorage.getItem("login_time"));
    const expiry = parseInt(localStorage.getItem("token_expiry")); // in ms
    const timeLeft = loginTime + expiry - Date.now();

    // If token doesn't exist or session already expired
    if (!token || timeLeft <= 0) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "MainLogin.html";
        return;
    }

    let logoutTimer;

    function resetLogoutTimer() {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            alert("Session expired due to inactivity.");
            localStorage.clear();
            window.location.href = "MainLogin.html";
        }, expiry); // reset for full session time on each activity
    }

    // Start the inactivity timer
    resetLogoutTimer();

    // Reset timer on user activity
    ["click", "mousemove", "keydown", "scroll", "touchstart"].forEach(event => {
        document.addEventListener(event, resetLogoutTimer);
    });
});