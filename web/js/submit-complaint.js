import { supabase } from "./api/database.js";
import { sanitizeInput, validateFileUpload } from './utils/security.js';

let currentLatitude = null;
let currentLongitude = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get user
  const user = checkAuth();
  if (!user) return;
  
  // Setup form
  setupComplaintForm(user);
  
  // Setup cancel button
  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});

// Mock functions and data that would normally be imported
function checkAuth() {
  // Replace with actual authentication logic
  return {
    username: 'testuser',
    name: 'Test User'
  };
}

const subcategories = {
  "Noise Complaint": ["Loud Music", "Construction Noise", "Barking Dogs"],
  "Property Maintenance": ["Graffiti", "Broken Windows", "Unkempt Yard"]
};

function showToast(message, type = 'success') {
  // Replace with actual toast notification implementation
  console.log(`Toast: ${message} (Type: ${type})`);
}

function addComplaint(complaintData) {
  // Replace with actual complaint submission logic (e.g., saving to localStorage or an API)
  const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
  const newComplaint = {
    id: Date.now(), // Generate a unique ID
    ...complaintData
  };
  complaints.push(newComplaint);
  localStorage.setItem('complaints', JSON.stringify(complaints));
  return newComplaint;
}

// Get user's location
async function getLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          currentLatitude = position.coords.latitude;
          currentLongitude = position.coords.longitude;
          resolve({ lat: currentLatitude, long: currentLongitude });
        },
        error => {
          console.error('Location error:', error);
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}

// Handle file uploads
async function handleFileUploads(complaintID) {
  const photoInput = document.getElementById('complaint-photo');
  const files = photoInput.files;

  for (let file of files) {
    try {
      // Validate file
      validateFileUpload(file);

      const fileName = `${complaintID}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
}

// Setup complaint form
function setupComplaintForm(user) {
  const complaintForm = document.getElementById('complaint-form');
  const complaintType = document.getElementById('complaint-type');
  const complaintSubcategory = document.getElementById('complaint-subcategory');
  
  // Populate subcategories based on selected complaint type
  complaintType.addEventListener('change', () => {
    const selectedType = complaintType.value;
    
    // Clear current options
    complaintSubcategory.innerHTML = '<option value="" disabled selected>Select subcategory</option>';
    
    // Add new options
    if (selectedType && subcategories[selectedType]) {
      subcategories[selectedType].forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory.toLowerCase().replace(/\s+/g, '_');
        option.textContent = subcategory;
        complaintSubcategory.appendChild(option);
      });
    }
  });
  
  // Handle form submission
  complaintForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
      userId: user.username,
      userName: user.name,
      title: document.getElementById('complaint-title').value,
      type: document.getElementById('complaint-type').value,
      subcategory: document.getElementById('complaint-subcategory').options[document.getElementById('complaint-subcategory').selectedIndex].text,
      urgency: document.getElementById('complaint-urgency').value,
      location: document.getElementById('complaint-location').value,
      description: document.getElementById('complaint-description').value,
      suggestedUnit: document.getElementById('suggested-unit').value
    };
    
    // Handle photo upload if provided
    const photoInput = document.getElementById('complaint-photo');
    if (photoInput.files.length > 0) {
      const file = photoInput.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Photo size exceeds the 5MB limit. Please choose a smaller image.', 'error');
        return;
      }
      
      // Convert to base64 for storage in localStorage
      const reader = new FileReader();
      reader.onload = function(event) {
        formData.photo = event.target.result;
        submitComplaint(formData);
      };
      reader.readAsDataURL(file);
    } else {
      submitComplaint(formData);
    }
  });
}

// Submit complaint to localStorage
async function submitComplaint(formData) {
  // Add complaint to localStorage
  const newComplaint = addComplaint(formData);
  
  if (newComplaint) {
    showToast('Complaint submitted successfully!');
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      window.location.href = 'my-complaints.html?id=' + newComplaint.id;
    }, 1500);
  } else {
    showToast('Failed to submit complaint. Please try again.', 'error');
  }
}

// Submit complaint form
async function submitComplaint(event) {
  event.preventDefault();
  
  try {
    const title = sanitizeInput(document.getElementById('complaint-title').value);
    const description = sanitizeInput(document.getElementById('complaint-description').value);
    const location = sanitizeInput(document.getElementById('complaint-location').value);
    const category = document.getElementById('complaint-type').value;
    const subCategory = document.getElementById('sub-category').value;
    const urgency = document.getElementById('urgency-level').value;
    const suggestedUnit = document.getElementById('suggested-unit').value;

    // Get current location if not set
    if (!currentLatitude || !currentLongitude) {
      try {
        await getLocation();
      } catch (error) {
        console.warn('Unable to get location:', error);
      }
    }

    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert([
        {
          title,
          description,
          location,
          userLoc: currentLatitude && currentLongitude 
            ? { lat: currentLatitude, long: currentLongitude }
            : null,
          category,
          subCategory,
          suggestDisp: suggestedUnit,
          urgency,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (complaintError) throw complaintError;

    // Handle file uploads
    const photoInput = document.getElementById('complaint-photo');
    if (photoInput.files.length > 0) {
      await handleFileUploads(complaint.complaintID);
    }

    showToast('Complaint submitted successfully!');
    setTimeout(() => {
      window.location.href = '/citizen/my-complaints.html';
    }, 1500);

  } catch (error) {
    console.error('Submission error:', error);
    showToast(error.message || 'Error submitting complaint. Please try again.', 'error');
  }
}

// Initialize form
document.getElementById('complaint-form').addEventListener('submit', submitComplaint);

// Get initial location
getLocation().catch(console.warn);