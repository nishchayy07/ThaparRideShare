/**
 * THAPAR RIDE SHARE - MAIN SCRIPT
 * Tech Stack: HTML5, CSS3, Vanilla JS (ES6+), Clerk Auth, Firebase Realtime Database
 * Features:
 * 1. Clerk Authentication (@thapar.edu only)
 * 2. Firebase Realtime Database Integration
 * 3. Ride Posting, Browsing, Filtering, and Deletion
 */

// --- FIREBASE CONFIGURATION ---
// TEMPORARY: Commented out for dummy data demo
// Uncomment after Firebase setup
/*
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
*/

// Global Variables
let currentFilter = 'all';
let currentUserEmail = '';

// --- 1. AUTHENTICATION & STARTUP ---

window.addEventListener('load', async function () {
    // Initialize Clerk
    // Note: It grabs the API Key automatically from your HTML tag
    try {
        await window.Clerk.load();
    } catch (err) {
        console.error("Clerk failed to load. Did you add the API Key to the HTML script tag?", err);
        return;
    }

    if (window.Clerk.user) {
        // --- USER IS LOGGED IN ---
        console.log("User:", window.Clerk.user.primaryEmailAddress.emailAddress);

        // Security Check: Enforce @thapar.edu
        const email = window.Clerk.user.primaryEmailAddress.emailAddress;
        if (!email.endsWith("@thapar.edu")) {
            alert("Access Restricted: Thapar Institute Students Only.");
            await window.Clerk.signOut();
            return;
        }

        // UI: Show Dashboard, Hide Login
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        // Store current user email for filtering "My Rides"
        currentUserEmail = email;

        // Mount User Profile Button (Top Right)
        const userButtonDiv = document.getElementById('user-button');
        window.Clerk.mountUserButton(userButtonDiv);

        // Listen to Firebase rides data
        loadRidesFromFirebase();

    } else {
        // --- USER IS NOT LOGGED IN ---
        console.log("User is NOT logged in");

        // UI: Show Login, Hide Dashboard
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';

        // Mount Sign-In Component
        const signInDiv = document.getElementById('sign-in-button');
        window.Clerk.mountSignIn(signInDiv, {
            appearance: {
                elements: {
                    formButtonPrimary: '#8A0000', // Thapar Red
                    footerAction: 'hidden' // Hides "Sign up" link
                }
            }
        });
    }
});


// --- 2. FIREBASE DATA LOADING ---

// TEMPORARY: Dummy data for screenshots (remove after Firebase setup)
const dummyRidesData = {
    'ride1': {
        origin: 'Thapar Hostels',
        destination: 'Chandigarh ISBT',
        date: '2025-12-05',
        time: '14:00',
        price: 450,
        seats_total: 4,
        seats_booked: 1,
        posted_by: 'Arjun Patel',
        posted_phone: '9876543210',
        posted_year: '3rd Year',
        posted_email: 'arjun.patel@thapar.edu',
        user_id: 'user_123',
        posted_at: '2025-11-29T10:30:00'
    },
    'ride2': {
        origin: 'TIET Main Gate',
        destination: 'Chandigarh Airport',
        date: '2025-12-06',
        time: '09:30',
        price: 600,
        seats_total: 4,
        seats_booked: 2,
        posted_by: 'Ananya Singh',
        posted_phone: '9123456789',
        posted_year: '2nd Year',
        posted_email: 'ananya.singh@thapar.edu',
        user_id: 'user_456',
        posted_at: '2025-11-28T15:45:00'
    },
    'ride3': {
        origin: 'Thapar University',
        destination: 'Ambala Cantt Railway Station',
        date: '2025-12-07',
        time: '16:00',
        price: 350,
        seats_total: 4,
        seats_booked: 0,
        posted_by: 'Rohan Sharma',
        posted_phone: '9988776655',
        posted_year: '4th Year',
        posted_email: 'rohan.sharma@thapar.edu',
        user_id: 'user_789',
        posted_at: '2025-11-30T08:20:00'
    },
    'ride4': {
        origin: 'New Delhi Airport',
        destination: 'Thapar Institute',
        date: '2025-12-08',
        time: '18:00',
        price: 800,
        seats_total: 4,
        seats_booked: 1,
        posted_by: 'Diya Mehta',
        posted_phone: '9876501234',
        posted_year: '2nd Year',
        posted_email: 'diya.mehta@thapar.edu',
        user_id: 'user_101',
        posted_at: '2025-11-29T12:00:00'
    },
    'ride5': {
        origin: 'Chandigarh Bus Stand',
        destination: 'TIET Campus',
        date: '2025-12-09',
        time: '11:00',
        price: 400,
        seats_total: 4,
        seats_booked: 3,
        posted_by: 'Advait Gupta',
        posted_phone: '9765432101',
        posted_year: '3rd Year',
        posted_email: 'advait.gupta@thapar.edu',
        user_id: 'user_202',
        posted_at: '2025-11-30T09:15:00'
    },
    'ride6': {
        origin: 'Delhi IGI Airport',
        destination: 'Thapar University',
        date: '2025-12-10',
        time: '20:00',
        price: 750,
        seats_total: 4,
        seats_booked: 0,
        posted_by: 'Isha Verma',
        posted_phone: '9654321987',
        posted_year: '1st Year',
        posted_email: 'isha.verma@thapar.edu',
        user_id: 'user_303',
        posted_at: '2025-11-30T07:30:00'
    },
    'ride7': {
        origin: 'Thapar Boys Hostel',
        destination: 'Shimla',
        date: '2025-12-12',
        time: '06:00',
        price: 1200,
        seats_total: 4,
        seats_booked: 2,
        posted_by: 'Kabir Malhotra',
        posted_phone: '9543210876',
        posted_year: 'M.Tech',
        posted_email: 'kabir.malhotra@thapar.edu',
        user_id: 'user_404',
        posted_at: '2025-11-29T18:00:00'
    },
    'ride8': {
        origin: 'Ludhiana Railway Station',
        destination: 'TIET Patiala',
        date: '2025-12-11',
        time: '13:30',
        price: 300,
        seats_total: 4,
        seats_booked: 1,
        posted_by: 'Saanvi Kapoor',
        posted_phone: '9432109876',
        posted_year: '4th Year',
        posted_email: 'saanvi.kapoor@thapar.edu',
        user_id: 'user_505',
        posted_at: '2025-11-30T10:45:00'
    }
};

function loadRidesFromFirebase() {
    // TEMPORARY: Use dummy data instead of Firebase
    // Comment out the line below and uncomment Firebase code after setup
    renderRides(dummyRidesData);
    return;
    
    // FIREBASE CODE (Uncomment after Firebase setup):
    /*
    const ridesRef = database.ref('rides');
    
    ridesRef.on('value', (snapshot) => {
        const ridesData = snapshot.val();
        renderRides(ridesData);
    }, (error) => {
        console.error('Error loading rides:', error);
    });
    */
}

// --- 3. DASHBOARD FUNCTIONS ---

function renderRides(ridesData) {
    const rideList = document.getElementById('ride-list');
    rideList.innerHTML = '';

    if (!ridesData) {
        rideList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car-side"></i>
                <h3>No rides available</h3>
                <p>Be the first to post a ride!</p>
            </div>
        `;
        return;
    }

    // Convert Firebase object to array
    const ridesArray = Object.keys(ridesData).map(key => ({
        id: key,
        ...ridesData[key]
    }));

    // Apply filtering logic based on project requirements
    let filteredRides = ridesArray;

    if (currentFilter === 'leaving') {
        // Filter A: Rides leaving from Thapar
        filteredRides = ridesArray.filter(ride => 
            ride.origin.toLowerCase().includes('thapar') || 
            ride.origin.toLowerCase().includes('tiet')
        );
    } else if (currentFilter === 'coming') {
        // Filter B: Rides going to Thapar
        filteredRides = ridesArray.filter(ride => 
            ride.destination.toLowerCase().includes('thapar') || 
            ride.destination.toLowerCase().includes('tiet')
        );
    } else if (currentFilter === 'my-rides') {
        // Show only current user's rides
        filteredRides = ridesArray.filter(ride => 
            ride.posted_email === currentUserEmail
        );
    }
    // else 'all' - show all rides

    if (filteredRides.length === 0) {
        rideList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car-side"></i>
                <h3>No rides available</h3>
                <p>Be the first to post a ride in this direction!</p>
            </div>
        `;
        return;
    }

    filteredRides.forEach(ride => {
        const seatsLeft = ride.seats_total - (ride.seats_booked || 0);
        const timeAgo = getTimeAgo(ride.posted_at);
        const initials = getInitials(ride.posted_by);
        const isMyRide = ride.posted_email === currentUserEmail;
        
        const card = document.createElement('div');
        card.className = 'ride-card';
        card.innerHTML = `
            <div class="ride-card-header">
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <div>
                        <div class="user-name">${ride.posted_by}${isMyRide ? ' (You)' : ''}</div>
                        <div class="posted-time"><i class="far fa-clock"></i> Posted ${timeAgo}</div>
                    </div>
                </div>
                <div class="seats-badge ${seatsLeft <= 1 ? 'seats-low' : ''}">
                    <i class="fas fa-users"></i> ${seatsLeft}/${ride.seats_total}
                </div>
            </div>
            
            <div class="route">
                <i class="fas fa-map-marker-alt" style="color: var(--primary); font-size: 0.9rem;"></i>
                <span>${ride.origin}</span>
            </div>
            <div class="route-arrow">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="route">
                <i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 0.9rem;"></i>
                <span>${ride.destination}</span>
            </div>
            
            <div class="ride-meta">
                <div class="meta-item">
                    <i class="far fa-calendar"></i>
                    <span>${formatDate(ride.date)}</span>
                </div>
                <div class="meta-item">
                    <i class="far fa-clock"></i>
                    <span>${formatTime(ride.time)}</span>
                </div>
                <div class="meta-item price-highlight">
                    <i class="fas fa-rupee-sign"></i>
                    <span>₹${ride.price}/person</span>
                </div>
            </div>
            
            ${isMyRide ? 
                `<button class="btn-danger full-width" onclick="deleteRide('${ride.id}')">
                    <i class="fas fa-trash"></i> Delete Ride
                </button>` :
                `<button class="btn-primary full-width" onclick="joinRide('${ride.id}')">
                    <i class="fas fa-plus-circle"></i> Join Ride
                </button>`
            }
        `;
        rideList.appendChild(card);
    });
}

function filterRides(type) {
    currentFilter = type;
    
    // Update Tab Styles
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if(event && event.target) {
        event.target.classList.add('active');
    }

    // Reload data from Firebase with new filter
    loadRidesFromFirebase();
}

let currentJoinRideId = null;

function joinRide(id) {
    // Find the ride details
    const ride = dummyRidesData[id];
    
    if (!ride) {
        alert('Ride not found!');
        return;
    }
    
    // Check if seats are available
    const seatsLeft = ride.seats_total - (ride.seats_booked || 0);
    if (seatsLeft <= 0) {
        alert('Sorry, no seats available for this ride!');
        return;
    }
    
    currentJoinRideId = id;
    
    // Display poster contact information
    const posterInfoDiv = document.getElementById('ride-poster-info');
    posterInfoDiv.innerHTML = `
        <div class="poster-detail">
            <div class="poster-avatar-large">${getInitials(ride.posted_by)}</div>
            <h3>${ride.posted_by}</h3>
        </div>
        <div class="info-row">
            <i class="fas fa-phone"></i>
            <span><strong>Phone:</strong> ${ride.posted_phone || 'Not provided'}</span>
        </div>
        <div class="info-row">
            <i class="fas fa-graduation-cap"></i>
            <span><strong>Year:</strong> ${ride.posted_year || 'Not provided'}</span>
        </div>
        <div class="info-row">
            <i class="fas fa-envelope"></i>
            <span><strong>Email:</strong> ${ride.posted_email}</span>
        </div>
        <div class="info-note">
            <i class="fas fa-check-circle"></i>
            Click "Join Ride" below to confirm and the seat count will be updated.
        </div>
    `;
    
    document.getElementById('join-modal').style.display = 'flex';
}

function confirmJoinRide() {
    if (!currentJoinRideId) return;
    
    const ride = dummyRidesData[currentJoinRideId];
    
    // Increase seats booked
    ride.seats_booked = (ride.seats_booked || 0) + 1;
    
    // Close modal
    closeJoinModal();
    
    // Refresh the ride list
    loadRidesFromFirebase();
    
    // Show success message
    alert('Successfully joined the ride!\n\nContact details saved. The ride poster will reach out to you.');
}

function closeJoinModal() {
    document.getElementById('join-modal').style.display = 'none';
    currentJoinRideId = null;
}

function deleteRide(rideId) {
    if (confirm('Are you sure you want to delete this ride?')) {
        // TEMPORARY: Delete from dummy data
        delete dummyRidesData[rideId];
        loadRidesFromFirebase(); // Refresh display
        alert('Ride deleted successfully!');
        
        // FIREBASE CODE (Uncomment after Firebase setup):
        /*
        database.ref('rides/' + rideId).remove()
            .then(() => {
                alert('Ride deleted successfully!');
            })
            .catch((error) => {
                console.error('Error deleting ride:', error);
                alert('Failed to delete ride. Please try again.');
            });
        */
    }
}

// Helper function to get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return posted.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Helper function to format date nicely
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Helper function to format time
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}


// --- 4. CREATE RIDE FORM LOGIC ---

function openModal() {
    document.getElementById('ride-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('ride-modal').style.display = 'none';
}

function calculatePerHead() {
    const cost = document.getElementById('total-cost').value;
    const capacity = document.getElementById('capacity').value;
    const display = document.getElementById('cost-display');

    if(cost && capacity > 0) {
        const perHead = Math.round(cost / capacity);
        display.textContent = `₹${perHead}`;
    } else {
        display.textContent = "₹0";
    }
}

function submitRide(e) {
    e.preventDefault();

    // Get poster details from form
    const posterName = document.getElementById('poster-name').value;
    const posterPhone = document.getElementById('poster-phone').value;
    const posterYear = document.getElementById('poster-year').value;

    // Get ride details from form
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const totalCost = document.getElementById('total-cost').value;
    const capacity = document.getElementById('capacity').value;

    // Get current user info from Clerk
    const userEmail = window.Clerk.user.primaryEmailAddress.emailAddress;
    const userId = window.Clerk.user.id;
    
    // Create new ride object matching project requirements
    const newRide = {
        origin: origin,
        destination: destination,
        date: date,
        time: time,
        price: Math.round(totalCost / capacity),
        seats_total: parseInt(capacity),
        seats_booked: 0,
        posted_by: posterName,
        posted_phone: posterPhone,
        posted_year: posterYear,
        posted_email: userEmail,
        user_id: userId,
        posted_at: new Date().toISOString()
    };

    // TEMPORARY: Add to dummy data for now
    const rideId = 'ride' + Date.now();
    dummyRidesData[rideId] = newRide;
    
    closeModal();
    loadRidesFromFirebase(); // Refresh display
    alert("Ride Posted Successfully!");
    
    // Reset form
    document.getElementById('ride-form').reset();
    document.getElementById('cost-display').textContent = "₹0";
    
    // FIREBASE CODE (Uncomment after Firebase setup):
    /*
    const newRideRef = database.ref('rides').push();
    newRideRef.set(newRide)
        .then(() => {
            closeModal();
            alert("Ride Posted Successfully!");
            
            // Reset form
            document.getElementById('ride-form').reset();
            document.getElementById('cost-display').textContent = "₹0";
        })
        .catch((error) => {
            console.error('Error posting ride:', error);
            alert('Failed to post ride. Please try again.');
        });
    */
}

// Close modal if clicking outside content
window.onclick = function(event) {
    const rideModal = document.getElementById('ride-modal');
    const joinModal = document.getElementById('join-modal');
    
    if (event.target == rideModal) {
        closeModal();
    }
    if (event.target == joinModal) {
        closeJoinModal();
    }
}