document.addEventListener("DOMContentLoaded", () => {
    const allListingsBtn = document.getElementById("allListingsBtn");
    const businessListingsBtn = document.getElementById("businessListingsBtn");
    const claimedListingsBtn = document.getElementById("claimedListingsBtn");

    // Logout button functionality
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        localStorage.removeItem("userType"); // Clear userType if stored
        window.location.href = "MainLogin.html";
    });

    // Button event listeners for switching sections
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

    // Load all available listings by default
    allListingsBtn.classList.add("active");
    fetchScrapListings();
});

// Show and hide loading overlay
function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

//close button for view modal
document.addEventListener("DOMContentLoaded", () => {
    const viewMapModal = document.getElementById("viewMapModal");
    const closeViewMapBtn = document.getElementById("closeViewMap");

    // ✅ Close modal when clicking the 'X' button
    closeViewMapBtn.addEventListener("click", () => {
        viewMapModal.style.display = "none";
    });

    // ✅ Close modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === viewMapModal) {
            viewMapModal.style.display = "none";
        }
    });
});

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

// Fetch available scrap listings
async function fetchScrapListings() {
    showLoading();
    try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) throw new Error("Please log in to view listings.");

        const response = await fetch(`http://localhost:5000/listings/scrap`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const listings = await response.json();
        const availableListings = listings.filter(listing => listing.status === "available");
        displayListings(availableListings, "Available Listings");
    } catch (error) {
        console.error("❌ Failed to fetch available listings:", error);
        displayError("Failed to load available listings: " + error.message);
    } finally {
        hideLoading();
    }
}

// Fetch business details
async function fetchBusinessDetails() {
    showLoading();
    try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) throw new Error("Please log in to view businesses.");

        const response = await fetch(`http://localhost:5000/users/businesses`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const businesses = await response.json();
        displayBusinesses(businesses);
    } catch (error) {
        console.error("❌ Failed to fetch business details:", error);
        displayError("Failed to load business details: " + error.message);
    } finally {
        hideLoading();
    }
}

// Fetch claimed listings (specific to user type)
async function fetchClaimedListings() {
    showLoading();
    try {
        const accessToken = localStorage.getItem("access_token");
        const userType = localStorage.getItem("userType"); // Assumes userType is stored
        const username = localStorage.getItem("username");
        if (!accessToken || !username) throw new Error("Please log in to view claimed listings.");

        let url = `http://localhost:5000/listings/scrap`;
        if (userType === "scrap_collector") {
            url = `http://localhost:5000/listings/claimed/mine`; // New endpoint for scrap collectors
        }

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const listings = await response.json();
        // For non-scrap collectors, filter claimed listings from /listings/scrap
        const claimedListings = userType === "scrap_collector" ? listings : listings.filter(listing => listing.status === "claimed");
        displayListings(claimedListings, "Claimed Listings");
    } catch (error) {
        console.error("❌ Failed to fetch claimed listings:", error);
        displayError("Failed to load claimed listings: " + error.message);
    } finally {
        hideLoading();
    }
}

// Create scrap listing card
function createListingCard(listing) {
    const card = document.createElement("div");
    card.setAttribute("data-listing-id", listing._id); // ✅ Fixed listing ID issue
    card.classList.add("listing-card");
    if (listing.status === "claimed") card.classList.add("claimed");

    let imageElement = listing.image_urls && listing.image_urls.length > 0
        ? `<img src="${listing.image_urls[0]}" alt="Waste Image" class="listing-image">`
        : "";

    card.innerHTML = `
        <div class="card-content">
            ${imageElement}
            <div class="listing-details">
                <h3>${listing.waste_type}</h3>
                <p>${listing.description}</p>
                <p><strong>Condition:</strong> ${listing.condition}</p>
                <p><strong>Location:</strong> ${listing.location_name}</p>
                <p><strong>Posted by:</strong> ${listing.username || "Unknown"}</p>
                ${listing.status === "claimed" ? `<p><strong>Claimed by:</strong> ${listing.claimed_by || "Unknown"}</p><button class="view-btn">View</button>` : '<button class="claim-btn" data-listing-id="' + listing._id + '">Claim</button><button class="view-btn">View</button>'}
            </div>
        </div>
    `;

    if (listing.status !== "claimed") {
        const claimButton = card.querySelector(".claim-btn");
        claimButton.addEventListener("click", () => handleClaimClick(listing._id,listing.username));
    }

    return card;
}

// ✅ Handle View button click and fetch correct lat/lng from MongoDB
document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("view-btn")) {
        const card = event.target.closest(".listing-card");
        const listingId = card.getAttribute("data-listing-id");

        if (!listingId) {
            alert("Listing ID not found.");
            return;
        }

        try {
            // ✅ Fetch the correct lat/lng from MongoDB
            const response = await fetch(`http://localhost:5000/listings/${listingId}`);
            const listingData = await response.json();

            if (!response.ok) {
                throw new Error("Failed to fetch listing details.");
            }

            const lat = parseFloat(listingData.latitude);
            const lng = parseFloat(listingData.longitude);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                updateMapDefaults(lat, lng); // ✅ Update map defaults
                showMapView(lat, lng); // ✅ Show map modal
            } else {
                alert("Location data is unavailable for this listing.");
            }

        } catch (error) {
            console.error("Error fetching listing details:", error);
            alert("Error fetching location data.");
        }
    }
});

// Create business card
function createBusinessCard(business) {
    const card = document.createElement("div");
    card.classList.add("listing-card", "business-card");

    const businessIconUrl = "https://sigmawire.net/i/04/9ATDQj.jpg";

    card.innerHTML = `
        <div class="card-content">
            <img src="${businessIconUrl}" alt="Business Icon" class="listing-image business-icon">
            <div class="listing-details">
                <h3>${business.business_name || "Unnamed Business"}</h3>
                <p><strong>Raw Materials:</strong> ${business.raw_material || "N/A"}</p>
                <p><strong>Contact:</strong> ${business.phone || "N/A"}</p>
                <p><strong>Email:</strong> ${business.email || "N/A"}</p>
                <p><strong>Representative:</strong> ${business.representative?.name || "N/A"} (${business.representative?.role || "N/A"})</p>
                <p><strong>GST Number:</strong> ${business.gst_number || "N/A"}</p>
                <p><strong>Registration:</strong> ${business.registration_number || "N/A"}</p>
            </div>
        </div>
    `;

    return card;
}

// Display listings
function displayListings(listings, sectionTitle) {
    const listingsContainer = document.getElementById("listingsContainer");
    listingsContainer.innerHTML = `<h2>${sectionTitle}</h2>`;

    if (listings.length === 0) {
        listingsContainer.innerHTML += "<p>No listings found.</p>";
        return;
    }

    listings.forEach(listing => {
        const card = createListingCard(listing);
        listingsContainer.appendChild(card);
    });
}

// Display business cards
function displayBusinesses(businesses) {
    const listingsContainer = document.getElementById("listingsContainer");
    listingsContainer.innerHTML = `<h2>Businesses</h2>`;

    if (businesses.length === 0) {
        listingsContainer.innerHTML += "<p>No businesses found.</p>";
        return;
    }

    businesses.forEach(business => {
        const card = createBusinessCard(business);
        listingsContainer.appendChild(card);
    });
}

// Handle claim button click

const handleClaimClick = async (listingId,Cusername) => { 
    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("access_token");

    // Check if user is logged in
    if (!username || !accessToken) {
        alert("You must be logged in to claim a listing.");
        return;
    }

    const claimDetails = {
        claimed_by: username,
        status: "claimed",
    };

    try {
        // Make PATCH request to backend with authorization
        const response = await fetch(`http://localhost:5000/listings/claim/${listingId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}` // Add token for backend verification
            },
            body: JSON.stringify(claimDetails),
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Claim successful:", result);
            // Update user's score in Supabase
            await updateUserScore(Cusername);
            window.location.reload();
        } else {
            console.error("Failed to claim:", result.error);
            alert(result.error || "Failed to claim listing.");
        }
    } catch (error) {
        console.error("Error while claiming:", error);
        alert("Server error while claiming. Please try again.");
    }
};

// Function to update the user's score in Supabase
async function updateUserScore(username) {
    try {
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(`http://localhost:5000/update-score`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}` // Add token for backend verification
            },
            body: JSON.stringify({ username })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Score updated successfully:", result);
        } else {
            console.error("Failed to update score:", result.error);
        }
    } catch (error) {
        console.error("Error while updating score:", error);
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