// ✅ Base URL logic at the top
const BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:5000" 
    : "https://ecoswap-4vyd.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const allListingsBtn = document.getElementById("allListingsBtn");
    const businessListingsBtn = document.getElementById("businessListingsBtn");
    const claimedListingsBtn = document.getElementById("claimedListingsBtn");

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        localStorage.removeItem("userType");
        window.location.href = "MainLogin.html";
    });

    allListingsBtn.addEventListener("click", () => {
        allListingsBtn.classList.add("active");
        businessListingsBtn.classList.remove("active");
        claimedListingsBtn.classList.remove("active");
        fetchScrapListings();
    });

    businessListingsBtn.addEventListener("click", () => {
        businessListingsBtn.classList.add("active");
        allListingsBtn.classList.remove("active");
        claimedListingsBtn.classList.remove("active");
        fetchBusinessDetails();
    });

    claimedListingsBtn.addEventListener("click", () => {
        claimedListingsBtn.classList.add("active");
        allListingsBtn.classList.remove("active");
        businessListingsBtn.classList.remove("active");
        fetchClaimedListings();
    });

    allListingsBtn.classList.add("active");
    fetchScrapListings();
});

function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

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

async function fetchScrapListings() {
    showLoading();
    try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Please log in to view listings.");

        const response = await fetch(`${BASE_URL}/listings/scrap`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const listings = await response.json();
        const available = listings.filter(l => l.status === "available");
        displayListings(available, "Available Listings");
    } catch (err) {
        console.error(err);
        displayError("Failed to load available listings: " + err.message);
    } finally {
        hideLoading();
    }
}

async function fetchBusinessDetails() {
    showLoading();
    try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Please log in to view businesses.");

        const response = await fetch(`${BASE_URL}/users/businesses`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const businesses = await response.json();
        displayBusinesses(businesses);
    } catch (err) {
        console.error(err);
        displayError("Failed to load business details: " + err.message);
    } finally {
        hideLoading();
    }
}

async function fetchClaimedListings() {
    showLoading();
    try {
        const token = localStorage.getItem("access_token");
        const type = localStorage.getItem("userType");
        const username = localStorage.getItem("username");

        if (!token || !username) throw new Error("Please log in to view claimed listings.");

        const url = type === "scrap_collector"
            ? `${BASE_URL}/listings/claimed/mine`
            : `${BASE_URL}/listings/scrap`;

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const listings = await response.json();
        const claimed = type === "scrap_collector"
            ? listings
            : listings.filter(l => l.status === "claimed");

        displayListings(claimed, "Claimed Listings");
    } catch (err) {
        console.error(err);
        displayError("Failed to load claimed listings: " + err.message);
    } finally {
        hideLoading();
    }
}

function createListingCard(listing) {
    const card = document.createElement("div");
    card.classList.add("listing-card");
    card.setAttribute("data-listing-id", listing._id);
    if (listing.status === "claimed") card.classList.add("claimed");

    const image = listing.image_urls?.[0]
        ? `<img src="${listing.image_urls[0]}" class="listing-image" alt="Waste Image">`
        : "";

    card.innerHTML = `
        <div class="card-content">
            ${image}
            <div class="listing-details">
                <h3>${listing.waste_type}</h3>
                <p>${listing.description}</p>
                <p><strong>Condition:</strong> ${listing.condition}</p>
                <p><strong>Location:</strong> ${listing.location_name}</p>
                <p><strong>Posted by:</strong> ${listing.username || "Unknown"}</p>
                ${listing.status === "claimed"
                    ? `<p><strong>Claimed by:</strong> ${listing.claimed_by || "Unknown"}</p><button class="view-btn">View</button>`
                    : `<button class="claim-btn" data-listing-id="${listing._id}">Claim</button><button class="view-btn">View</button>`}
            </div>
        </div>`;

    if (listing.status !== "claimed") {
        const claimBtn = card.querySelector(".claim-btn");
        claimBtn.addEventListener("click", () => handleClaimClick(listing._id, listing.username));
    }

    return card;
}

document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("view-btn")) {
        const card = event.target.closest(".listing-card");
        const id = card.getAttribute("data-listing-id");

        try {
            const response = await fetch(`${BASE_URL}/listings/${id}`);
            const data = await response.json();
            const { latitude: lat, longitude: lng } = data;

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                updateMapDefaults(lat, lng);
                showMapView(lat, lng);
            } else {
                alert("Location data is unavailable.");
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching location data.");
        }
    }
});

function createBusinessCard(business) {
    const card = document.createElement("div");
    card.classList.add("listing-card", "business-card");

    card.innerHTML = `
        <div class="card-content">
            <img src="https://sigmawire.net/i/04/9ATDQj.jpg" class="listing-image business-icon" alt="Business Icon">
            <div class="listing-details">
                <h3>${business.business_name || "Unnamed Business"}</h3>
                <p><strong>Raw Materials:</strong> ${business.raw_material || "N/A"}</p>
                <p><strong>Contact:</strong> ${business.phone || "N/A"}</p>
                <p><strong>Email:</strong> ${business.email || "N/A"}</p>
                <p><strong>Representative:</strong> ${business.representative?.name || "N/A"} (${business.representative?.role || "N/A"})</p>
                <p><strong>GST Number:</strong> ${business.gst_number || "N/A"}</p>
                <p><strong>Registration:</strong> ${business.registration_number || "N/A"}</p>
            </div>
        </div>`;
    return card;
}

function displayListings(listings, title) {
    const container = document.getElementById("listingsContainer");
    container.innerHTML = `<h2>${title}</h2>`;
    if (listings.length === 0) return container.innerHTML += "<p>No listings found.</p>";
    listings.forEach(l => container.appendChild(createListingCard(l)));
}

function displayBusinesses(businesses) {
    const container = document.getElementById("listingsContainer");
    container.innerHTML = "<h2>Businesses</h2>";
    if (businesses.length === 0) return container.innerHTML += "<p>No businesses found.</p>";
    businesses.forEach(b => container.appendChild(createBusinessCard(b)));
}

const handleClaimClick = async (id, cUsername) => {
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("username");
    if (!token || !username) return alert("You must be logged in to claim.");

    try {
        const response = await fetch(`${BASE_URL}/listings/claim/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ claimed_by: username, status: "claimed" })
        });

        const result = await response.json();
        if (response.ok) {
            await updateUserScore(cUsername);
            window.location.reload();
        } else {
            alert(result.error || "Claim failed.");
        }
    } catch (err) {
        alert("Error claiming listing.");
        console.error(err);
    }
};

async function updateUserScore(username) {
    try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${BASE_URL}/update-score`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) console.error("Failed to update score:", await response.json());
    } catch (err) {
        console.error("Error updating score:", err);
    }
}


// ✅ Map Setup
const viewMapModal = document.getElementById("viewMapModal");
const closeViewMapBtn = document.getElementById("closeViewMap");
let viewMap;
let viewMarker;

// ✅ Function to update map defaults
function updateMapDefaults(lat, lng) {
    defaultLat = lat;
    defaultLng = lng;

    if (viewMap) {
        viewMap.setView([lat, lng], 12);
        if (viewMarker) {
            viewMarker.setLatLng([lat, lng]);
        } else {
            viewMarker = L.marker([lat, lng]).addTo(viewMap);
        }
    }
}

// ✅ Function to show map modal
function showMapView(lat, lng) {
    if (!viewMapModal) return alert("Error: Unable to display the map.");

    viewMapModal.style.display = "flex";

    try {
        if (!viewMap) {
            viewMap = L.map("viewMap", {
                center: [lat, lng],
                zoom: 12,
                zoomControl: true
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            }).addTo(viewMap);
        }

        if (!viewMarker) {
            viewMarker = L.marker([lat, lng]).addTo(viewMap);
        } else {
            viewMarker.setLatLng([lat, lng]);
        }

        viewMap.setView([lat, lng], 15);
    } catch (error) {
        console.error("❌ Error while updating map view:", error);
        alert("An unexpected error occurred while loading the map.");
    }
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