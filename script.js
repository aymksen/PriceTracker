// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnkAnrnlB-Gsn3fXFMy0wtKRQC1CctG8k",
  authDomain: "pricet-d6b87.firebaseapp.com",
  projectId: "pricet-d6b87",
  storageBucket: "pricet-d6b87.firebasestorage.app",
  messagingSenderId: "382843904692",
  appId: "1:382843904692:web:f867a407c5c52399232de1",
  measurementId: "G-HMDKMB3XQ7",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better performance
db.enablePersistence()
  .catch((err) => {
    console.error("Firebase persistence error:", err.code);
  });

// Global state
let currentUser = null;
let isAdmin = false;
let allFoodItems = [];
let allCities = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fes",
  "Tangier",
  "Agadir",
  "Meknes",
  "Oujda",
  "Kenitra",
  "Tetouan",
  "Safi",
  "Mohammedia",
  "El Jadida",
  "Taza",
  "Nador",
];

// Charts
let allCitiesChart = null;
let casablancaChart = null;
let trendChart = null;

// DOM Elements
const pages = document.querySelectorAll('section[id$="-page"]');
const navLinks = document.querySelectorAll("nav a");
const authActionBtn = document.getElementById("auth-action");
const userRoleSpan = document.getElementById("user-role");
const authRequiredElements = document.querySelectorAll(".auth-required");
const adminRequiredElements = document.querySelectorAll(".admin-required");

// Auth Modal
const authModal = document.getElementById("auth-modal");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const toRegisterLink = document.getElementById("to-register");
const toLoginLink = document.getElementById("to-login");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

// Dashboard Elements
const totalEntriesEl = document.getElementById("total-entries");
const citiesCoveredEl = document.getElementById("cities-covered");
const itemsTrackedEl = document.getElementById("items-tracked");
const lastUpdateEl = document.getElementById("last-update");
const foodItemSelect = document.getElementById("food-item-select");

// Prices Page Elements
const filterCitySelect = document.getElementById("filter-city");
const filterFoodItemSelect = document.getElementById("filter-food-item");
const filterDateRange = document.getElementById("filter-date-range");
const clearFiltersBtn = document.getElementById("clear-filters");
const applyFiltersBtn = document.getElementById("apply-filters");
const pricesTableBody = document.getElementById("prices-table-body");

// Add Price Page Elements
const addPriceForm = document.getElementById("add-price-form");
const addPriceFoodItemSelect = document.getElementById("food-item");
const priceInput = document.getElementById("price");
const citySelect = document.getElementById("city");
const dateInput = document.getElementById("date");
const addFoodItemForm = document.getElementById("add-food-item-form");
const newFoodItemInput = document.getElementById("new-food-item");
const foodCategorySelect = document.getElementById("food-category");

// Admin Page Elements
const adminTabs = document.querySelectorAll(".admin-tab");
const adminTabContents = document.querySelectorAll(".admin-tab-content");
const usersTableBody = document.getElementById("users-table-body");
const allEntriesTableBody = document.getElementById("all-entries-table-body");
const foodItemsTableBody = document.getElementById("food-items-table-body");
const addFoodItemBtn = document.getElementById("add-food-item-btn");

// Edit Price Modal
const editPriceModal = document.getElementById("edit-price-modal");
const editPriceForm = document.getElementById("edit-price-form");
const editPriceId = document.getElementById("edit-price-id");
const editFoodItem = document.getElementById("edit-food-item");
const editPrice = document.getElementById("edit-price");
const editCity = document.getElementById("edit-city");
const editDate = document.getElementById("edit-date");
const saveEditBtn = document.getElementById("save-edit");

// Add Food Item Modal
const addFoodItemModal = document.getElementById("add-food-item-modal");
const modalAddFoodItemForm = document.getElementById("modal-add-food-item-form");
const modalNewFoodItem = document.getElementById("modal-new-food-item");
const modalFoodCategory = document.getElementById("modal-food-category");
const modalSaveFoodItemBtn = document.getElementById("modal-save-food-item");

// Delete Confirmation Modal
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const deleteItemId = document.getElementById("delete-item-id");
const deleteItemType = document.getElementById("delete-item-type");
const confirmDeleteBtn = document.getElementById("confirm-delete");

// Close buttons for all modals
const modalCloseButtons = document.querySelectorAll(".modal-close");

// Initialize the application
function init() {
  try {
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split("T")[0];
    if (dateInput) dateInput.value = today;

    // Setup populating city selects
    populateCitySelects();

    // Set up event listeners
    setupEventListeners();

    // Check if user is authenticated
    auth.onAuthStateChanged(handleAuthStateChanged);

    // Load initial data
    loadFoodItems()
      .then(() => {
        // After food items are loaded, load other data
        return Promise.all([
          loadDashboardData(),
          setupCharts()
        ]);
      })
      .catch(error => {
        console.error("Error initializing data:", error);
        showErrorMessage("Error initializing data. Please refresh the page.");
      });

    // Show dashboard page by default
    showPage("dashboard");
  } catch (error) {
    console.error("Initialization error:", error);
    showErrorMessage("Application initialization failed. Please refresh the page.");
  }
}

// Populate city selects
function populateCitySelects() {
  // Helper function to populate city select elements
  const populateSelect = (selectElement) => {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Select a city</option>';
    allCities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      selectElement.appendChild(option);
    });
  };

  // Populate all city select elements
  populateSelect(citySelect);
  populateSelect(editCity);
  
  // Populate filter city select
  if (filterCitySelect) {
    filterCitySelect.innerHTML = '<option value="">All Cities</option>';
    allCities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      filterCitySelect.appendChild(option);
    });
  }
}

// Handle authentication state changes
function handleAuthStateChanged(user) {
  currentUser = user;

  if (user) {
    // User is signed in
    checkIfAdmin(user);
    authActionBtn.textContent = "Logout";
    userRoleSpan.textContent = "logged-in user";

    // Enable auth-required elements
    authRequiredElements.forEach((el) => {
      el.classList.remove("hidden");
    });

    // Update user last active timestamp
    db.collection("users")
      .doc(user.uid)
      .update({
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((error) => {
        console.error("Error updating last active timestamp:", error);
      });
  } else {
    // User is signed out
    isAdmin = false;
    authActionBtn.textContent = "Login / Register";
    userRoleSpan.textContent = "non-logged-in user";

    // Disable auth-required elements
    authRequiredElements.forEach((el) => {
      if (el.tagName === "A") {
        // Don't hide nav links, just make them trigger the auth modal
      } else {
        el.classList.add("hidden");
      }
    });

    // Disable admin-required elements
    adminRequiredElements.forEach((el) => {
      el.classList.add("hidden");
    });

    // If on admin page, redirect to dashboard
    if (getCurrentPage() === "admin") {
      showPage("dashboard");
    }
  }

  // Refresh data based on auth state
  loadPricesData();
  if (isAdmin) {
    loadAdminData();
  }
}

// Check if user is an admin
function checkIfAdmin(user) {
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      if (doc.exists && doc.data().role === "admin") {
        isAdmin = true;
        userRoleSpan.textContent = "admin user";

        // Enable admin-required elements
        adminRequiredElements.forEach((el) => {
          el.classList.remove("hidden");
        });
      } else {
        isAdmin = false;

        // Disable admin-required elements
        adminRequiredElements.forEach((el) => {
          el.classList.add("hidden");
        });

        // If on admin page, redirect to dashboard
        if (getCurrentPage() === "admin") {
          showPage("dashboard");
        }
      }
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
      isAdmin = false;
    });
}

// Get the current page ID
function getCurrentPage() {
  const visiblePage = Array.from(pages).find(
    (page) => !page.classList.contains("hidden")
  );
  return visiblePage ? visiblePage.id.replace("-page", "") : null;
}

// Show a specific page
function showPage(pageId) {
  // Hide all pages
  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  // Show the selected page
  const selectedPage = document.getElementById(`${pageId}-page`);
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  // Update active nav link
  navLinks.forEach((link) => {
    if (link.getAttribute("data-page") === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Load page-specific data
  if (pageId === "dashboard") {
    loadDashboardData();
    if (allCitiesChart && casablancaChart && trendChart) {
      updateAllCitiesChartData();
      updateCasablancaChartData();
      const activePeriodButton = document.querySelector(".chart-btn.active");
      const period = activePeriodButton
        ? activePeriodButton.getAttribute("data-period")
        : "30";
      updateTrendChart(period);
    } else {
      setupCharts();
    }
  } else if (pageId === "prices") {
    loadPricesData();
  } else if (pageId === "admin" && isAdmin) {
    loadAdminData();
  }
}

// Show error message (can be customized to show UI notifications)
function showErrorMessage(message) {
  console.error(message);
  alert(message);
}

// Set up event listeners
function setupEventListeners() {
  // Navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = link.getAttribute("data-page");

      // Check if auth is required for this page
      if (link.classList.contains("auth-required") && !currentUser) {
        openAuthModal();
        return;
      }

      // Check if admin is required for this page
      if (link.classList.contains("admin-required") && !isAdmin) {
        alert("You need admin privileges to access this page.");
        return;
      }

      showPage(pageId);
    });
  });

  // Auth action button (Login/Logout)
  authActionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentUser) {
      // Logout
      auth
        .signOut()
        .then(() => {
          console.log("User signed out");
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          showErrorMessage("Error signing out: " + error.message);
        });
    } else {
      // Show login modal
      openAuthModal();
    }
  });

  // Login form
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        closeModal(authModal);
        loginForm.reset();
        loginError.classList.add("hidden");
      })
      .catch((error) => {
        loginError.textContent = error.message;
        loginError.classList.remove("hidden");
      });
  });

  // Register form
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (password.length < 6) {
      const passwordRequirement = document.getElementById("password-requirement");
      passwordRequirement.classList.remove("hidden");
      return;
    }

    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Create user document in Firestore
        return db.collection("users").doc(userCredential.user.uid).set({
          email: email,
          role: "user",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        });
      })
      .then(() => {
        closeModal(authModal);
        registerForm.reset();
        registerError.classList.add("hidden");
      })
      .catch((error) => {
        registerError.textContent = error.message;
        registerError.classList.remove("hidden");
      });
  });

  // Toggle between login and register forms
  toRegisterLink.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    toRegisterLink.classList.add("hidden");
    toLoginLink.classList.remove("hidden");
    loginError.classList.add("hidden");
  });

  toLoginLink.addEventListener("click", () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    toLoginLink.classList.add("hidden");
    toRegisterLink.classList.remove("hidden");
    registerError.classList.add("hidden");
  });

  // Add price form
  addPriceForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentUser) {
      openAuthModal();
      return;
    }

    const foodItem = addPriceFoodItemSelect.value;
    const price = parseFloat(priceInput.value);
    const city = citySelect.value;
    const date = dateInput.value;

    // Validate inputs
    if (!foodItem || isNaN(price) || price <= 0 || !city || !date) {
      alert("Please fill all fields with valid values.");
      return;
    }

    // Show loading indicator
    const saveButton = addPriceForm.querySelector('button[type="submit"]');
    const originalText = saveButton.textContent;
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    // Get the food item document reference
    db.collection("foodItems")
      .where("name", "==", foodItem)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          throw new Error("Food item not found");
        }

        const foodItemRef = snapshot.docs[0].ref;
        const foodItemId = snapshot.docs[0].id;

        // Add price entry
        return db.collection("prices").add({
          foodItemId: foodItemId,
          foodItemName: foodItem,
          price: price,
          city: city,
          date: new Date(date),
          addedBy: currentUser.uid,
          addedByEmail: currentUser.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      })
      .then(() => {
        alert("Price entry added successfully!");
        addPriceForm.reset();

        // Set today's date again
        const today = new Date().toISOString().split("T")[0];
        if (dateInput) dateInput.value = today;

        // Refresh data
        loadDashboardData();
        loadPricesData();
      })
      .catch((error) => {
        console.error("Error adding price entry:", error);
        alert("Error adding price entry: " + error.message);
      })
      .finally(() => {
        // Restore button state
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      });
  });

  // Add food item form
  addFoodItemForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!currentUser) {
      openAuthModal();
      return;
    }

    const foodItemName = newFoodItemInput.value;
    const category = foodCategorySelect.value;

    // Validate inputs
    if (!foodItemName || !category) {
      alert("Please fill all fields with valid values.");
      return;
    }

    // Show loading indicator
    const saveButton = addFoodItemForm.querySelector('button[type="submit"]');
    const originalText = saveButton.textContent;
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    // Check if food item already exists
    db.collection("foodItems")
      .where("name", "==", foodItemName)
      .get()
      .then((snapshot) => {
        if (!snapshot.empty) {
          throw new Error("Food item already exists");
        }

        // Add food item
        return db.collection("foodItems").add({
          name: foodItemName,
          category: category,
          createdBy: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      })
      .then(() => {
        alert("Food item added successfully!");
        addFoodItemForm.reset();

        // Refresh food items
        return loadFoodItems();
      })
      .catch((error) => {
        console.error("Error adding food item:", error);
        alert("Error adding food item: " + error.message);
      })
      .finally(() => {
        // Restore button state
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      });
  });

  // Admin tabs
  adminTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");

      // Update active tab
      adminTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Show corresponding tab content
      adminTabContents.forEach((content) => {
        if (content.id === `${tabId}-tab`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      });

      // Load tab-specific data
      if (tabId === "users") {
        loadUsersData();
      } else if (tabId === "all-entries") {
        loadAllEntriesData();
      } else if (tabId === "food-items") {
        loadFoodItemsData();
      }
    });
  });

  // Add food item button in admin panel
  addFoodItemBtn.addEventListener("click", () => {
    openModal(addFoodItemModal);
  });

  // Modal add food item form
  modalSaveFoodItemBtn.addEventListener("click", () => {
    const foodItemName = modalNewFoodItem.value;
    const category = modalFoodCategory.value;

    // Validate inputs
    if (!foodItemName || !category) {
      alert("Please fill all fields with valid values.");
      return;
    }

    // Show loading indicator
    modalSaveFoodItemBtn.textContent = "Saving...";
    modalSaveFoodItemBtn.disabled = true;

    // Check if food item already exists
    db.collection("foodItems")
      .where("name", "==", foodItemName)
      .get()
      .then((snapshot) => {
        if (!snapshot.empty) {
          throw new Error("Food item already exists");
        }

        // Add food item
        return db.collection("foodItems").add({
          name: foodItemName,
          category: category,
          createdBy: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      })
      .then(() => {
        alert("Food item added successfully!");
        modalAddFoodItemForm.reset();
        closeModal(addFoodItemModal);

        // Refresh food items
        return loadFoodItems().then(() => {
          if (getCurrentPage() === "admin") {
            loadFoodItemsData();
          }
        });
      })
      .catch((error) => {
        console.error("Error adding food item:", error);
        alert("Error adding food item: " + error.message);
      })
      .finally(() => {
        // Restore button state
        modalSaveFoodItemBtn.textContent = "Save";
        modalSaveFoodItemBtn.disabled = false;
      });
  });

  // Save edit button in edit price modal
  saveEditBtn.addEventListener("click", () => {
    const priceId = editPriceId.value;
    const price = parseFloat(editPrice.value);
    const city = editCity.value;
    const date = editDate.value;

    // Validate inputs
    if (isNaN(price) || price <= 0 || !city || !date) {
      alert("Please fill all fields with valid values.");
      return;
    }

    // Show loading indicator
    saveEditBtn.textContent = "Saving...";
    saveEditBtn.disabled = true;

    // Update price entry
    db.collection("prices")
      .doc(priceId)
      .update({
        price: price,
        city: city,
        date: new Date(date),
        updatedBy: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        alert("Price entry updated successfully!");
        closeModal(editPriceModal);

        // Refresh data
        loadDashboardData();
        loadPricesData();
        if (isAdmin) {
          loadAllEntriesData();
        }
      })
      .catch((error) => {
        console.error("Error updating price entry:", error);
        alert("Error updating price entry: " + error.message);
      })
      .finally(() => {
        // Restore button state
        saveEditBtn.textContent = "Save Changes";
        saveEditBtn.disabled = false;
      });
  });

  // Confirm delete button
  confirmDeleteBtn.addEventListener("click", () => {
    const itemId = deleteItemId.value;
    const itemType = deleteItemType.value;

    // Show loading indicator
    confirmDeleteBtn.textContent = "Deleting...";
    confirmDeleteBtn.disabled = true;

    if (itemType === "price") {
      // Delete price entry
      db.collection("prices")
        .doc(itemId)
        .delete()
        .then(() => {
          alert("Price entry deleted successfully!");
          closeModal(deleteConfirmModal);

          // Refresh data
          loadDashboardData();
          loadPricesData();
          if (isAdmin) {
            loadAllEntriesData();
          }
        })
        .catch((error) => {
          console.error("Error deleting price entry:", error);
          alert("Error deleting price entry: " + error.message);
        })
        .finally(() => {
          // Restore button state
          confirmDeleteBtn.textContent = "Delete";
          confirmDeleteBtn.disabled = false;
        });
    } else if (itemType === "foodItem") {
      // Check if the food item has any price entries
      db.collection("prices")
        .where("foodItemId", "==", itemId)
        .get()
        .then((snapshot) => {
          if (!snapshot.empty) {
            throw new Error("Cannot delete food item with existing price entries. Delete all related price entries first.");
          }

          // Delete food item
          return db.collection("foodItems").doc(itemId).delete();
        })
        .then(() => {
          alert("Food item deleted successfully!");
          closeModal(deleteConfirmModal);

          // Refresh food items
          return loadFoodItems().then(() => {
            if (getCurrentPage() === "admin") {
              loadFoodItemsData();
            }
          });
        })
        .catch((error) => {
          console.error("Error deleting food item:", error);
          alert("Error deleting food item: " + error.message);
        })
        .finally(() => {
          // Restore button state
          confirmDeleteBtn.textContent = "Delete";
          confirmDeleteBtn.disabled = false;
        });
    }
  });

  // Close modal buttons
  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal-overlay");
      closeModal(modal);
    });
  });

  // Filter buttons
  clearFiltersBtn.addEventListener("click", () => {
    filterCitySelect.value = "";
    filterFoodItemSelect.value = "";
    filterDateRange.value = "";
    loadPricesData();
  });

  applyFiltersBtn.addEventListener("click", () => {
    loadPricesData();
  });

  // Chart period buttons
  const chartPeriodButtons = document.querySelectorAll(".chart-btn");
  chartPeriodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      chartPeriodButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const period = button.getAttribute("data-period");
      updateTrendChart(period);
    });
  });

  // Food item select for trend chart
  foodItemSelect.addEventListener("change", () => {
    const activePeriodButton = document.querySelector(".chart-btn.active");
    const period = activePeriodButton
      ? activePeriodButton.getAttribute("data-period")
      : "30";
    updateTrendChart(period);
  });
}

// Load food items from Firebase
function loadFoodItems() {
  return db.collection("foodItems")
    .orderBy("name")
    .get()
    .then((snapshot) => {
      allFoodItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update food item selects
      updateFoodItemSelects();
      return allFoodItems;
    })
    .catch((error) => {
      console.error("Error loading food items:", error);
      showErrorMessage("Error loading food items. Please refresh the page.");
      return [];
    });
}

// Update all food item select elements
function updateFoodItemSelects() {
  try {
    // Update main food item select
    if (foodItemSelect) {
      foodItemSelect.innerHTML = '<option value="">Select Food Item</option>';
      allFoodItems.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        foodItemSelect.appendChild(option);
      });
    }

    // Update add price food item select
    if (addPriceFoodItemSelect) {
      addPriceFoodItemSelect.innerHTML = '<option value="">Select a food item</option>';
      allFoodItems.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        addPriceFoodItemSelect.appendChild(option);
      });
    }

    // Update filter food item select
    if (filterFoodItemSelect) {
      filterFoodItemSelect.innerHTML = '<option value="">All Items</option>';
      allFoodItems.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        filterFoodItemSelect.appendChild(option);
      });
    }

    // Update edit food item select
    if (editFoodItem) {
      const currentValue = editFoodItem.value;
      editFoodItem.innerHTML = '';
      allFoodItems.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        editFoodItem.appendChild(option);
      });
      // Restore selected value if possible
      if (currentValue && allFoodItems.some(item => item.name === currentValue)) {
        editFoodItem.value = currentValue;
      }
    }
  } catch (error) {
    console.error("Error updating food item selects:", error);
  }
}

// Load dashboard data
function loadDashboardData() {
  // Use a batch to get all dashboard data more efficiently
  const promises = [
    // Total entries
    db.collection("prices").get(),
    
    // Food items count
    db.collection("foodItems").get(),
    
    // Last update
    db.collection("prices").orderBy("timestamp", "desc").limit(1).get()
  ];

  Promise.all(promises)
    .then(([pricesSnapshot, foodItemsSnapshot, lastUpdateSnapshot]) => {
      // Total entries
      totalEntriesEl.textContent = pricesSnapshot.size;
      
      // Cities covered
      const cities = new Set();
      pricesSnapshot.docs.forEach(doc => {
        cities.add(doc.data().city);
      });
      citiesCoveredEl.textContent = cities.size;
      
      // Items tracked
      itemsTrackedEl.textContent = foodItemsSnapshot.size;
      
      // Last update
      if (!lastUpdateSnapshot.empty) {
        const lastUpdateTimestamp = lastUpdateSnapshot.docs[0].data().timestamp;
        if (lastUpdateTimestamp) {
          const date = lastUpdateTimestamp.toDate();
          lastUpdateEl.textContent = formatDate(date);
        } else {
          lastUpdateEl.textContent = "N/A";
        }
      } else {
        lastUpdateEl.textContent = "N/A";
      }
      
      // Update charts data
      updateAllCitiesChartData();
      updateCasablancaChartData();
      
      const activePeriodButton = document.querySelector(".chart-btn.active");
      const period = activePeriodButton
        ? activePeriodButton.getAttribute("data-period")
        : "30";
      updateTrendChart(period);
    })
    .catch((error) => {
      console.error("Error loading dashboard data:", error);
      // Set default values if data loading fails
      totalEntriesEl.textContent = "-";
      citiesCoveredEl.textContent = "-";
      itemsTrackedEl.textContent = "-";
      lastUpdateEl.textContent = "-";
    });
}

// Load prices data with better error handling and pagination
function loadPricesData() {
  // Get filter values
  const city = filterCitySelect ? filterCitySelect.value : "";
  const foodItem = filterFoodItemSelect ? filterFoodItemSelect.value : "";
  const dateFilter = filterDateRange ? filterDateRange.value : "";

  // Show loading indicator
  if (pricesTableBody) {
    pricesTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Loading data...</td></tr>`;
  }

  // Build query
  let query = db.collection("prices");

  try {
    // Add filters carefully to avoid invalid queries
    if (city) {
      query = query.where("city", "==", city);
    }

    if (foodItem) {
      query = query.where("foodItemName", "==", foodItem);
    }

    // Date filtering logic
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      
      // Make sure date is valid before using it
      if (!isNaN(filterDate.getTime())) {
        // Set time to start of day
        filterDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Only apply these filters if we haven't already applied other filters
        // that would make this compound query invalid
        if (city && foodItem) {
          // Can't use more inequality filters with city and foodItem already filtered
          query = query.orderBy("date", "desc");
        } else {
          query = query.where("date", ">=", filterDate).where("date", "<", nextDay);
        }
      }
    } else {
      // If no date filter, always sort by date descending
      query = query.orderBy("date", "desc");
    }

    // Limit to 100 results for performance
    query = query.limit(100);

    // Execute query
    query.get()
      .then((snapshot) => {
        // Clear table
        if (!pricesTableBody) return;
        pricesTableBody.innerHTML = "";

        // No results
        if (snapshot.empty) {
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="5" class="text-center">No price entries found</td>`;
          pricesTableBody.appendChild(row);
          return;
        }

        // Populate table
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const row = document.createElement("tr");

          // Make sure date is handled properly
          let formattedDate = "Invalid date";
          if (data.date) {
            const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
            formattedDate = formatDate(dateObj);
          }

          row.innerHTML = `
            <td>${data.foodItemName || ""}</td>
            <td>${(data.price || 0).toFixed(2)}</td>
            <td>${data.city || ""}</td>
            <td>${formattedDate}</td>
            <td class="actions-cell">
              ${
                currentUser
                  ? `
                  <button class="action-btn edit" data-id="${doc.id}">
                    <i class="fas fa-edit"></i>
                  </button>
                  ${
                    isAdmin || (currentUser && data.addedBy === currentUser.uid)
                      ? `
                      <button class="action-btn delete" data-id="${doc.id}">
                        <i class="fas fa-trash"></i>
                      </button>
                    `
                      : ""
                  }
                `
                  : ""
              }
            </td>
          `;

          pricesTableBody.appendChild(row);

          // Add event listeners for edit and delete buttons
          const editButton = row.querySelector(".edit");
          if (editButton) {
            editButton.addEventListener("click", () => {
              openEditPriceModal(doc.id, data);
            });
          }

          const deleteButton = row.querySelector(".delete");
          if (deleteButton) {
            deleteButton.addEventListener("click", () => {
              openDeleteConfirmModal(doc.id, "price");
            });
          }
        });
      })
      .catch((error) => {
        console.error("Error loading prices data:", error);
        if (pricesTableBody) {
          pricesTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Error loading data: ${error.message}</td></tr>`;
        }
      });
  } catch (error) {
    console.error("Error building query:", error);
    if (pricesTableBody) {
      pricesTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Error building query: ${error.message}</td></tr>`;
    }
  }
}

// Load admin data
function loadAdminData() {
  if (!isAdmin) return;

  // Load users data for the users tab
  loadUsersData();
}

// Load users data for admin panel
function loadUsersData() {
  if (!isAdmin || !usersTableBody) return;

  // Show loading indicator
  usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Loading data...</td></tr>`;

  db.collection("users")
    .get()
    .then((snapshot) => {
      // Clear table
      usersTableBody.innerHTML = "";

      // No results
      if (snapshot.empty) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6" class="text-center">No users found</td>`;
        usersTableBody.appendChild(row);
        return;
      }

      // Process each user in parallel
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          // Count entries for this user
          const entriesSnapshot = await db.collection("prices")
            .where("addedBy", "==", doc.id)
            .get();
          
          const entriesCount = entriesSnapshot.size;
          
          // Create row element
          const row = document.createElement("tr");
          
          // Format last active date
          let lastActiveText = "N/A";
          if (data.lastActive) {
            try {
              lastActiveText = formatDate(data.lastActive.toDate());
            } catch (e) {
              console.error("Error formatting last active date:", e);
            }
          }
          
          row.innerHTML = `
            <td>${data.email || "Unknown"}</td>
            <td>${doc.id}</td>
            <td>${data.role || "user"}</td>
            <td>${entriesCount}</td>
            <td>${lastActiveText}</td>
            <td class="actions-cell">
              <button class="action-btn" data-action="make-admin" data-id="${doc.id}" ${data.role === "admin" ? "disabled" : ""}>
                <i class="fas fa-user-shield"></i>
              </button>
              <button class="action-btn" data-action="remove-admin" data-id="${doc.id}" ${data.role !== "admin" ? "disabled" : ""}>
                <i class="fas fa-user"></i>
              </button>
            </td>
          `;
          
          return { row, userId: doc.id };
        } catch (error) {
          console.error("Error processing user:", error);
          // Return a row with error indication
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${data.email || "Unknown"}</td>
            <td>${doc.id}</td>
            <td>${data.role || "user"}</td>
            <td>Error</td>
            <td>Error</td>
            <td>Error loading data</td>
          `;
          return { row, userId: doc.id };
        }
      });
      
      // Wait for all rows to be processed
      return Promise.all(promises);
    })
    .then((results) => {
      // Add all rows to the table
      results.forEach(({ row, userId }) => {
        usersTableBody.appendChild(row);
        
        // Add event listeners for admin buttons
        const makeAdminButton = row.querySelector('[data-action="make-admin"]');
        if (makeAdminButton) {
          makeAdminButton.addEventListener("click", () => {
            makeUserAdmin(userId);
          });
        }
        
        const removeAdminButton = row.querySelector('[data-action="remove-admin"]');
        if (removeAdminButton) {
          removeAdminButton.addEventListener("click", () => {
            removeUserAdmin(userId);
          });
        }
      });
    })
    .catch((error) => {
      console.error("Error loading users data:", error);
      usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading data: ${error.message}</td></tr>`;
    });
}

// Load all entries data for admin panel with optimized queries
function loadAllEntriesData() {
  if (!isAdmin || !allEntriesTableBody) return;

  // Show loading indicator
  allEntriesTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading data...</td></tr>`;

  db.collection("prices")
    .orderBy("timestamp", "desc")
    .limit(100) // Limit for better performance
    .get()
    .then((snapshot) => {
      // Clear table
      allEntriesTableBody.innerHTML = "";

      // No results
      if (snapshot.empty) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="7" class="text-center">No price entries found</td>`;
        allEntriesTableBody.appendChild(row);
        return;
      }

      // Populate table
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement("tr");

        // Make sure date is handled properly
        let formattedDate = "Invalid date";
        if (data.date) {
          try {
            const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
            formattedDate = formatDate(dateObj);
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }

        row.innerHTML = `
          <td>${doc.id}</td>
          <td>${data.foodItemName || ""}</td>
          <td>${(data.price || 0).toFixed(2)}</td>
          <td>${data.city || ""}</td>
          <td>${formattedDate}</td>
          <td>${data.addedByEmail || "N/A"}</td>
          <td class="actions-cell">
            <button class="action-btn edit" data-id="${doc.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" data-id="${doc.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;

        allEntriesTableBody.appendChild(row);

        // Add event listeners for edit and delete buttons
        const editButton = row.querySelector(".edit");
        if (editButton) {
          editButton.addEventListener("click", () => {
            openEditPriceModal(doc.id, data);
          });
        }

        const deleteButton = row.querySelector(".delete");
        if (deleteButton) {
          deleteButton.addEventListener("click", () => {
            openDeleteConfirmModal(doc.id, "price");
          });
        }
      });
    })
    .catch((error) => {
      console.error("Error loading all entries data:", error);
      allEntriesTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading data: ${error.message}</td></tr>`;
    });
}

// Load food items data for admin panel
function loadFoodItemsData() {
  if (!isAdmin || !foodItemsTableBody) return;

  // Show loading indicator
  foodItemsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Loading data...</td></tr>`;

  db.collection("foodItems")
    .orderBy("name")
    .get()
    .then((snapshot) => {
      // Clear table
      foodItemsTableBody.innerHTML = "";

      // No results
      if (snapshot.empty) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="5" class="text-center">No food items found</td>`;
        foodItemsTableBody.appendChild(row);
        return;
      }

      // Process each food item in parallel
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          // Count entries for this food item
          const entriesSnapshot = await db.collection("prices")
            .where("foodItemId", "==", doc.id)
            .get();
          
          const entriesCount = entriesSnapshot.size;
          
          // Create row element
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${doc.id}</td>
            <td>${data.name || ""}</td>
            <td>${data.category || ""}</td>
            <td>${entriesCount}</td>
            <td class="actions-cell">
              <button class="action-btn delete" data-id="${doc.id}" ${entriesCount > 0 ? 'disabled title="Remove price entries first"' : ''}>
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          
          return { row, itemId: doc.id, hasEntries: entriesCount > 0 };
        } catch (error) {
          console.error("Error processing food item:", error);
          // Return a row with error indication
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${doc.id}</td>
            <td>${data.name || ""}</td>
            <td>${data.category || ""}</td>
            <td>Error</td>
            <td>Error loading data</td>
          `;
          return { row, itemId: doc.id, hasEntries: false };
        }
      });
      
      // Wait for all rows to be processed
      return Promise.all(promises);
    })
    .then((results) => {
      // Add all rows to the table
      results.forEach(({ row, itemId, hasEntries }) => {
        foodItemsTableBody.appendChild(row);
        
        // Add event listener for delete button if no entries exist
        if (!hasEntries) {
          const deleteButton = row.querySelector(".delete");
          if (deleteButton) {
            deleteButton.addEventListener("click", () => {
              openDeleteConfirmModal(itemId, "foodItem");
            });
          }
        }
      });
    })
    .catch((error) => {
      console.error("Error loading food items data:", error);
      foodItemsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Error loading data: ${error.message}</td></tr>`;
    });
}

// Open auth modal
function openAuthModal() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  toRegisterLink.classList.remove("hidden");
  toLoginLink.classList.add("hidden");
  loginError.classList.add("hidden");
  registerError.classList.add("hidden");
  openModal(authModal);
}

// Open edit price modal
function openEditPriceModal(priceId, priceData) {
  // Validate price data to avoid errors
  if (!priceData) {
    console.error("Invalid price data for editing");
    return;
  }
  
  editPriceId.value = priceId;
  editFoodItem.value = priceData.foodItemName || "";
  editPrice.value = priceData.price || "";
  editCity.value = priceData.city || "";

  // Format date for input
  try {
    const date = priceData.date && priceData.date.toDate ? 
      priceData.date.toDate() : 
      new Date(priceData.date || Date.now());
    
    const formattedDate = date.toISOString().split("T")[0];
    editDate.value = formattedDate;
  } catch (error) {
    console.error("Error formatting date for edit modal:", error);
    // Use today's date as fallback
    const today = new Date().toISOString().split("T")[0];
    editDate.value = today;
  }

  openModal(editPriceModal);
}

// Open delete confirmation modal
function openDeleteConfirmModal(itemId, itemType) {
  deleteItemId.value = itemId;
  deleteItemType.value = itemType;
  
  // Update message based on item type
  const messageElement = deleteConfirmModal.querySelector("p");
  if (messageElement) {
    messageElement.textContent = `Are you sure you want to delete this ${itemType === "price" ? "price entry" : "food item"}?`;
  }
  
  openModal(deleteConfirmModal);
}

// Open a modal
function openModal(modal) {
  if (modal) modal.style.display = "flex";
}

// Close a modal
function closeModal(modal) {
  if (modal) modal.style.display = "none";
}

// Make a user admin
function makeUserAdmin(userId) {
  db.collection("users")
    .doc(userId)
    .update({
      role: "admin",
    })
    .then(() => {
      alert("User promoted to admin successfully!");
      loadUsersData();
    })
    .catch((error) => {
      console.error("Error making user admin:", error);
      alert("Error making user admin: " + error.message);
    });
}

// Remove admin role from a user
function removeUserAdmin(userId) {
  db.collection("users")
    .doc(userId)
    .update({
      role: "user",
    })
    .then(() => {
      alert("Admin role removed successfully!");
      loadUsersData();
    })
    .catch((error) => {
      console.error("Error removing admin role:", error);
      alert("Error removing admin role: " + error.message);
    });
}

// Setup charts with better configuration
function setupCharts() {
  // Destroy existing charts to prevent memory leaks
  if (allCitiesChart) allCitiesChart.destroy();
  if (casablancaChart) casablancaChart.destroy();
  if (trendChart) trendChart.destroy();

  // All cities chart
  const allCitiesCtx = document.getElementById("all-cities-chart");
  if (allCitiesCtx) {
    allCitiesChart = new Chart(allCitiesCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Average Price (MAD)",
            data: [],
            backgroundColor: "rgba(0, 99, 65, 0.6)",
            borderColor: "rgba(0, 99, 65, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Price: ${context.parsed.y.toFixed(2)} MAD`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Price (MAD)",
            },
            ticks: {
              callback: function(value) {
                return value + " MAD";
              }
            }
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        animation: {
          duration: 1000
        }
      },
    });
  }

  // Casablanca chart
  const casablancaCtx = document.getElementById("casablanca-chart");
  if (casablancaCtx) {
    casablancaChart = new Chart(casablancaCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Price in Casablanca (MAD)",
            data: [],
            backgroundColor: "rgba(193, 39, 45, 0.6)",
            borderColor: "rgba(193, 39, 45, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Price: ${context.parsed.y.toFixed(2)} MAD`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Price (MAD)",
            },
            ticks: {
              callback: function(value) {
                return value + " MAD";
              }
            }
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        animation: {
          duration: 1000
        }
      },
    });
  }

  // Trend chart
  const trendCtx = document.getElementById("trend-chart");
  if (trendCtx) {
    trendChart = new Chart(trendCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Price Trend (MAD)",
            data: [],
            backgroundColor: "rgba(0, 99, 65, 0.1)",
            borderColor: "rgba(0, 99, 65, 1)",
            borderWidth: 2,
            tension: 0.2,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Price: ${context.parsed.y.toFixed(2)} MAD`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Price (MAD)",
            },
            ticks: {
              callback: function(value) {
                return value + " MAD";
              }
            }
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        animation: {
          duration: 1000
        }
      },
    });
  }

  // First update to fill charts
  updateAllCitiesChartData();
  updateCasablancaChartData();
  updateTrendChart("30");
}

// Update all cities chart data with better error handling
function updateAllCitiesChartData() {
  if (!allCitiesChart) return;

  // Show loading state on chart
  allCitiesChart.data.labels = [];
  allCitiesChart.data.datasets[0].data = [];
  allCitiesChart.update('none');

  // Get the 5 most recent food items with data
  db.collection("foodItems")
    .orderBy("createdAt", "desc")
    .limit(10) // Get more to increase chances of having data
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return [];
      
      const foodItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get prices for each food item
      const promises = foodItems.map((item) => {
        return db.collection("prices")
          .where("foodItemId", "==", item.id)
          .get()
          .then((pricesSnapshot) => {
            if (pricesSnapshot.empty) {
              return null; // No data for this item
            }

            let totalPrice = 0;
            pricesSnapshot.docs.forEach((doc) => {
              const price = doc.data().price;
              if (!isNaN(price)) {
                totalPrice += price;
              }
            });

            return {
              name: item.name,
              avgPrice: totalPrice / pricesSnapshot.size,
            };
          });
      });

      return Promise.all(promises);
    })
    .then((results) => {
      // Filter out null results (items with no data)
      const validResults = results.filter(item => item !== null);
      
      // If no valid results, show a message
      if (validResults.length === 0) {
        allCitiesChart.data.labels = ["No data available"];
        allCitiesChart.data.datasets[0].data = [0];
        allCitiesChart.update();
        return;
      }
      
      // Sort by average price
      validResults.sort((a, b) => b.avgPrice - a.avgPrice);
      
      // Take only the top 5
      const topItems = validResults.slice(0, 5);

      // Update chart
      allCitiesChart.data.labels = topItems.map((item) => item.name);
      allCitiesChart.data.datasets[0].data = topItems.map((item) => item.avgPrice);
      allCitiesChart.update();
    })
    .catch((error) => {
      console.error("Error updating all cities chart:", error);
      allCitiesChart.data.labels = ["Error loading data"];
      allCitiesChart.data.datasets[0].data = [0];
      allCitiesChart.update();
    });
}

// Update Casablanca chart data
function updateCasablancaChartData() {
  if (!casablancaChart) return;

  // Show loading state on chart
  casablancaChart.data.labels = [];
  casablancaChart.data.datasets[0].data = [];
  casablancaChart.update('none');

  // Get the most recent food items
  db.collection("foodItems")
    .orderBy("createdAt", "desc")
    .limit(10) // Get more to increase chances of having data
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return [];
      
      const foodItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // For each food item, get the most recent price in Casablanca
      const promises = foodItems.map((item) => {
        return db.collection("prices")
          .where("foodItemId", "==", item.id)
          .where("city", "==", "Casablanca")
          .orderBy("date", "desc")
          .limit(1)
          .get()
          .then((pricesSnapshot) => {
            if (pricesSnapshot.empty) {
              return null; // No data for this item in Casablanca
            }

            const price = pricesSnapshot.docs[0].data().price;
            if (isNaN(price)) return null;

            return {
              name: item.name,
              price: price,
            };
          });
      });

      return Promise.all(promises);
    })
    .then((results) => {
      // Filter out null results (items with no data in Casablanca)
      const validResults = results.filter(item => item !== null);
      
      // If no valid results, show a message
      if (validResults.length === 0) {
        casablancaChart.data.labels = ["No data available"];
        casablancaChart.data.datasets[0].data = [0];
        casablancaChart.update();
        return;
      }
      
      // Sort by price
      validResults.sort((a, b) => b.price - a.price);
      
      // Take only the top 5
      const topItems = validResults.slice(0, 5);

      // Update chart
      casablancaChart.data.labels = topItems.map((item) => item.name);
      casablancaChart.data.datasets[0].data = topItems.map((item) => item.price);
      casablancaChart.update();
    })
    .catch((error) => {
      console.error("Error updating Casablanca chart:", error);
      casablancaChart.data.labels = ["Error loading data"];
      casablancaChart.data.datasets[0].data = [0];
      casablancaChart.update();
    });
}

// Update trend chart with better date handling
function updateTrendChart(periodDays) {
  if (!trendChart) return;

  // Show loading state
  trendChart.data.labels = [];
  trendChart.data.datasets[0].data = [];
  trendChart.update('none');

  const foodItemName = foodItemSelect ? foodItemSelect.value : "";

  if (!foodItemName) {
    // Clear chart if no food item selected
    trendChart.data.labels = ["Select a food item"];
    trendChart.data.datasets[0].data = [0];
    trendChart.options.plugins.title = {
      display: true,
      text: "Select a food item to view price trends",
    };
    trendChart.update();
    return;
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(periodDays));

  // Get food item ID first
  db.collection("foodItems")
    .where("name", "==", foodItemName)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        throw new Error("Food item not found");
      }
      
      const foodItemId = snapshot.docs[0].id;
      
      // Get price data with the food item ID for better performance
      return db.collection("prices")
        .where("foodItemId", "==", foodItemId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "asc")
        .get();
    })
    .then((snapshot) => {
      if (snapshot.empty) {
        // No data for this period
        trendChart.data.labels = ["No data available"];
        trendChart.data.datasets[0].data = [0];
        trendChart.options.plugins.title = {
          display: true,
          text: `No data found for ${foodItemName} in the last ${periodDays} days`,
        };
        trendChart.update();
        return;
      }

      // Group by date and average prices for each date
      const pricesByDate = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        try {
          const dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
          const date = formatDate(dateObj);

          if (!pricesByDate[date]) {
            pricesByDate[date] = {
              totalPrice: 0,
              count: 0,
            };
          }

          const price = data.price;
          if (!isNaN(price)) {
            pricesByDate[date].totalPrice += price;
            pricesByDate[date].count += 1;
          }
        } catch (e) {
          console.error("Error processing date:", e);
        }
      });

      // Calculate averages and sort by date
      const dateLabels = Object.keys(pricesByDate).sort((a, b) => {
        // Sort dates in ascending order (DD/MM/YYYY format)
        const partsA = a.split('/');
        const partsB = b.split('/');
        const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
        const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
        return dateA - dateB;
      });
      
      const avgPrices = dateLabels.map(
        (date) => pricesByDate[date].totalPrice / pricesByDate[date].count
      );

      // Update chart
      trendChart.data.labels = dateLabels;
      trendChart.data.datasets[0].data = avgPrices;
      trendChart.options.plugins.title = {
        display: true,
        text: `Price Trend for ${foodItemName} (Last ${periodDays} Days)`,
      };
      trendChart.update();
    })
    .catch((error) => {
      console.error("Error updating trend chart:", error);
      trendChart.data.labels = ["Error loading data"];
      trendChart.data.datasets[0].data = [0];
      trendChart.options.plugins.title = {
        display: true,
        text: `Error: ${error.message}`,
      };
      trendChart.update();
    });
}

// Helper function to format date
function formatDate(date) {
  if (!date || isNaN(date)) return "Invalid date";
  
  try {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);