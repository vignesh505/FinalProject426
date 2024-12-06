const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const addMedicationForm = document.getElementById('add-medication-form');
const medicationList = document.getElementById('medication-list');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const logoutButton = document.getElementById('logout-button');
const findMedicationButton = document.getElementById('find-medication');
const addCategoryForm = document.getElementById('add-category-form');
const categoryList = document.getElementById('category-list');

// Register User
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert('Registration successful! Logging you in...');
    login(username, password);
  } else {
    alert('Registration failed. Try again.');
  }
});

// Login User
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  login(username, password);
});

// Login Function
async function login(username, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert('Login successful!');
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid login credentials.');
  }
}

// Logout User
logoutButton?.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  alert('Logged out successfully!');
  window.location.href = 'index.html';
});

// Populate Category Dropdown
async function populateCategoryDropdown(dropdownId) {
  const response = await fetch('/categories');
  if (response.ok) {
    const categories = await response.json();
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = `<option value="">No Category</option>`; 
    categories.forEach((category) => {
      dropdown.innerHTML += `<option value="${category.id}">${category.name}</option>`;
    });
  }
}

// Add Medication
addMedicationForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('medication-name').value;
  const dosage = document.getElementById('medication-dosage').value;
  const frequency = document.getElementById('medication-frequency').value;
  const time = document.getElementById('medication-time').value;
  const category_id = document.getElementById('medication-category').value;

  const response = await fetch('/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dosage, frequency, time, category_id }),
  });

  if (response.ok) {
    alert('Medication added successfully!');
    loadMedications();
    addMedicationForm.reset();
  } else {
    alert('Failed to add medication.');
  }
});

// Load Medications
async function loadMedications() {
  const response = await fetch('/medications');
  if (response.ok) {
    const medications = await response.json();
    medicationList.innerHTML = medications
      .map(
        (med) =>
          `<li>
            <strong>${med.name}</strong>: ${med.dosage}, ${med.frequency} at ${med.time}
            ${med.category_name ? `(Category: ${med.category_name})` : '(No Category)'}
            <button onclick="editMedication(${med.id}, '${med.name}', '${med.dosage}', '${med.frequency}', '${med.time}', '${med.category_id || ''}')">Edit</button>
            <button onclick="deleteMedication(${med.id})">Delete</button>
          </li>`
      )
      .join('');
  } else {
    alert('Failed to load medications.');
  }
}

// Edit Medication
async function editMedication(id, currentName, currentDosage, currentFrequency, currentTime, currentCategory) {
  const newName = prompt('Enter new medication name:', currentName);
  const newDosage = prompt('Enter new dosage:', currentDosage);
  const newFrequency = prompt('Enter new frequency:', currentFrequency);
  const newTime = prompt('Enter new time (HH:MM):', currentTime);
  const newCategory = prompt('Enter new category ID (leave blank for no category):', currentCategory);

  const response = await fetch(`/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      dosage: newDosage,
      frequency: newFrequency,
      time: newTime,
      category_id: newCategory || null,
    }),
  });

  if (response.ok) {
    alert('Medication updated successfully!');
    loadMedications();
  } else {
    alert('Failed to update medication.');
  }
}

// Delete Medication
async function deleteMedication(id) {
  const confirmDelete = confirm('Are you sure you want to delete this medication?');
  if (!confirmDelete) return;

  const response = await fetch(`/medications/${id}`, { method: 'DELETE' });

  if (response.ok) {
    alert('Medication deleted successfully!');
    loadMedications();
  } else {
    alert('Failed to delete medication.');
  }
}

// Add Category
addCategoryForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('category-name').value;

  const response = await fetch('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (response.ok) {
    alert('Category added successfully!');
    loadCategories();
    populateCategoryDropdown('medication-category');
    addCategoryForm.reset();
  } else {
    alert('Failed to add category.');
  }
})

// Load Categories
async function loadCategories() {
  const response = await fetch('/categories');
  if (response.ok) {
    const categories = await response.json();
    categoryList.innerHTML = categories
      .map(
        (category) =>
          `<li>
            ${category.name}
            <button onclick="editCategory(${category.id}, '${category.name}')">Edit</button>
            <button onclick="deleteCategory(${category.id})">Delete</button>
          </li>`
      )
      .join('');
  } else {
    alert('Failed to load categories.');
  }
}
findMedicationButton?.addEventListener('click', async () => {
  const medicationName = prompt('Enter the medication name to search:');
  if (!medicationName) return;

  try {
    const response = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${medicationName.toLowerCase()}`
    );

    let consolidatedInfo = `**Medication Details**\n- **Name:** ${medicationName}\n`;

    if (response.ok) {
      const data = await response.json();
      const drugInfo = data.results?.[0];

      if (drugInfo) {
        const purpose = drugInfo.purpose?.[0] || 'Purpose not available';

        let warnings = 'Warnings not available';
        if (drugInfo.warnings?.[0]) {
          warnings = drugInfo.warnings[0].length > 300
            ? drugInfo.warnings[0].substring(0, 300) + '...'
            : drugInfo.warnings[0];
        }

        let sideEffects = 'Side effects not available';
        if (drugInfo.adverse_reactions?.[0]) {
          sideEffects = drugInfo.adverse_reactions[0].length > 300
            ? drugInfo.adverse_reactions[0].substring(0, 300) + '...'
            : drugInfo.adverse_reactions[0];
        }

        consolidatedInfo += `
        **OpenFDA Information:**
        - **Purpose:** ${purpose}
        - **Warnings:** ${warnings}
        - **Side Effects:** ${sideEffects}`;

     
        let fullDataButton = document.getElementById('full-info-button');
        if (!fullDataButton) {
          
          fullDataButton = document.createElement('button');
          fullDataButton.id = 'full-info-button';

        
          fullDataButton.style.padding = '15px 25px'; 
          fullDataButton.style.marginTop = '20px';
          fullDataButton.style.backgroundColor = '#007BFF'; 
          fullDataButton.style.color = 'white';
          fullDataButton.style.border = 'none';
          fullDataButton.style.borderRadius = '8px'; 
          fullDataButton.style.fontSize = '18px'; 
          fullDataButton.style.fontWeight = 'bold'; 
          fullDataButton.style.cursor = 'pointer';
          fullDataButton.style.display = 'block';
          fullDataButton.style.textAlign = 'center';
          fullDataButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; 
          fullDataButton.style.transition = 'transform 0.2s ease, background-color 0.2s ease';

          
          fullDataButton.onmouseover = () => {
            fullDataButton.style.backgroundColor = '#0056b3';
            fullDataButton.style.transform = 'scale(1.05)'; 
          };
          fullDataButton.onmouseout = () => {
            fullDataButton.style.backgroundColor = '#007BFF';
            fullDataButton.style.transform = 'scale(1)'; 
          };

          document.body.appendChild(fullDataButton);
        }

        
        fullDataButton.textContent = `View Full Information for ${medicationName}`;
        fullDataButton.onclick = () => {
          let fullDetails = `**Full Details for ${medicationName}:**\n`;

          fullDetails += drugInfo.warnings?.[0]
            ? `\n**Warnings:**\n${drugInfo.warnings[0]}`
            : '';
          fullDetails += drugInfo.adverse_reactions?.[0]
            ? `\n\n**Side Effects:**\n${drugInfo.adverse_reactions[0]}`
            : '';

          alert(fullDetails);
        };
      } else {
        consolidatedInfo += '**OpenFDA Information:** Not available\n';
      }
    } else {
      consolidatedInfo += '**OpenFDA Information:** Not available\n';
    }

    
    alert(consolidatedInfo);
  } catch (error) {
    console.error('Error fetching medication details:', error);
    alert('Error fetching medication details. Please try again later.');
  }
});
// Edit Category
async function editCategory(id, oldName) {
  const newName = prompt('Enter new category name:', oldName);
  if (!newName) return;

  const response = await fetch(`/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });

  if (response.ok) {
    alert('Category updated successfully!');
    loadCategories();
  } else {
    alert('Failed to update category.');
  }
}

// Delete Category
async function deleteCategory(id) {
  const confirmDelete = confirm('Are you sure you want to delete this category?');
  if (!confirmDelete) return;

  const response = await fetch(`/categories/${id}`, { method: 'DELETE' });

  if (response.ok) {
    alert('Category deleted successfully!');
    loadCategories();
  } else {
    alert('Failed to delete category.');
  }
}

// Initialize Dropdowns and Data
if (addMedicationForm) populateCategoryDropdown('medication-category');
if (categoryList) loadCategories();
if (dashboard) loadMedications();
