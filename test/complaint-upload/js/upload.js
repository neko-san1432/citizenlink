/**
 * Complaint Upload Module
 * Handles file uploads, form validation, and complaint submission
 * with security measures and duplicate detection
 */
import { supabase } from "../../../js/api/database.js";
const title = document.getElementById("complaint-title");
const type = document.getElementById("complaint-type");
const subCategory = document.getElementById("complaint-subcategory");
const urgencyLevel = document.getElementById("complaint-urgency");
const suggestedUnitDispatch = document.getElementById("suggested-unit");
const location = document.getElementById("complaint-location");
const description = document.getElementById("complaint-description");
const photo = document.getElementById("complaint-photo");
const form = document.getElementById("complaint-form");
const cancel = document.getElementById("cancel-btn");
let currentLatitude = 0;
let currentLongitude = 0;

// File upload constraints
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Rate limiting
const RATE_LIMIT = {
  maxRequests: 5,
  timeWindow: 60 * 1000, // 1 minute
  requests: [],
};

// Security functions for file uploads
function sanitizeInput(input) {
  if (!input) return "";
  // Remove any HTML tags and special characters
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s.,!?-]/g, "")
    .trim();
}

function sanitizeFileName(fileName) {
  // Remove path traversal and invalid characters
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

async function validateFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function (e) {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      // Check file signatures
      const isValid =
        header.startsWith("ffd8") || // JPEG
        header.startsWith("89504e47") || // PNG
        header.startsWith("47494638"); // GIF
      resolve(isValid);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// Enhanced file validation
async function validateFile(file) {
  // Size check  
  if (file.size > MAX_FILE_SIZE) {
    // TODO: Replace with proper error dialog showing file size limits and recommended compression methods
    alert(`File ${file.name} is too large. Maximum size is 5MB`);
    return false;
  }

  // Type check
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    // TODO: Replace with proper error dialog showing supported file types and conversion suggestions
    alert(`Invalid file type. Allowed: JPEG, PNG, GIF, WebP`);
    return false;
  }

  // Content validation
  try {
  if (!(await validateFileContent(file))) {
      // TODO: Replace with proper error dialog explaining file validation failure and recovery steps
      alert(
        "Invalid file content detected. File appears to be modified or corrupted."
      );
      return false;
    }
  } catch (error) {
    console.error("File validation error:", error);
    return false;
  }
  // Time check - temporarily disabled
  // const timeDifference = (Date.now() - file.lastModified) / (1000 * 60 * 60);
  // if (timeDifference > 1) {
  //   alert(`File must be less than 1 hour old`);
  //   return false;
  // }

  return true;
}

const bannedWords = [
  "yawa",
  "puta",
  "putang-ina",
  "putangina",
  "tangina",
  "waa",
  "fuck",
  "fck",
  "shit",
  "sht",
];

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await formChecker();
});
cancel.addEventListener("click", () => {
  if (
    title.value !== "" ||
    description.value !== "" ||
    (type.value !== "" && subCategory.value !== "") ||
    urgencyLevel.value !== "" ||
    suggestedUnitDispatch.value !== "" ||
    location.value !== "" ||
    photo.value !== ""
  ) {
    window.addEventListener("beforeunload", function (e) {
      e.preventDefault(); // Some browsers require this
    });
  }
  //going to the base
  title.value = "";
  description.value = "";
  type.value = "";
  subCategory.value = "";
  urgencyLevel.value = "";
  suggestedUnitDispatch.value = "";
  location.value = "";
  photo.value = "";
  //GOTO
});

// Handle both change and drop events
async function handleFiles(fileList) {
  const files = Array.from(fileList);
  const imagesPlaceholder = document.getElementById("imagesPlaceholder");

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const sanitizedName = sanitizeFileName(file.name);
    // Store sanitized name with file for later use
    file.sanitizedName = sanitizedName;
    
    if (await validateFile(file)) {
      displayImage(file, index);
    }
  }
}

function displayImage(file, index) {
  const imagesPlaceholder = document.getElementById("imagesPlaceholder");
  const imageContainer = document.createElement("div");
  imageContainer.style.marginBottom = "10px";

  // Create image preview
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.maxWidth = "200px";
  img.style.maxHeight = "200px";

  // Create delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = () => {
    const dt = new DataTransfer();
    const { files } = photo;

    // Copy all files except the deleted one
    for (let i = 0; i < files.length; i++) {
      if (i !== index) dt.items.add(files[i]);
    }

    photo.files = dt.files; // Update the file input
    imageContainer.remove(); // Remove preview
    URL.revokeObjectURL(img.src); // Clean up memory
  };

  imageContainer.appendChild(img);
  imageContainer.appendChild(deleteBtn);
  imagesPlaceholder.appendChild(imageContainer);
}
photo.addEventListener("change", async (e) => {
  const files = e.target.files;
  await handleFiles(files);
});

// Handle drag and drop
const dropZone = document.getElementById("imagesPlaceholder");
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.backgroundColor = "#f0f0f0";
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.backgroundColor = "transparent";
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.backgroundColor = "transparent";

  const dt = e.dataTransfer;
  const files = dt.files;

  await handleFiles(files);
});

/**
 * Validates the complaint form submission
 * Checks for banned words, required fields, and potential duplicates
 * through location proximity, time window, and content similarity
 */
async function formChecker() {
  const tester = new RegExp(`\\b(${bannedWords.join("|")})\\b`, "i");
  const sanitizedTitle = sanitizeInput(title.value);
  const sanitizedDescription = sanitizeInput(description.value);
  const titleCheck = tester.test(sanitizedTitle);
  const descriptionCheck = tester.test(sanitizedDescription);
  if (titleCheck || descriptionCheck) {
    // TODO: Replace with proper error dialog highlighting inappropriate language and community guidelines
    alert("Banned words detected");
    return;
  }
  if (
    !sanitizedTitle ||
    !sanitizedDescription ||
    !type.value ||
    !subCategory.value ||
    !urgencyLevel.value ||
    !suggestedUnitDispatch.value ||
    !location.value  ) {
    // TODO: Replace with proper error dialog highlighting missing fields and form completion instructions
    alert("Empty required fields detected");
    return;
  }
  //duplication criteria: location proximity, time window check  if (
    (await locationProximity()) &&
    (await timeWindowChecking()) &&
    (await titleAndDescriptionSimilarities())
  {
    // TODO: Replace with proper error dialog showing details of the similar existing complaint
    alert("Duplicate complaint");
    return;
  }
  // If all checks pass, submit the form
  await submitForm();
}

/**
 * Checks if a complaint exists within 50 meters of the current location
 * Uses Turf.js for geospatial calculations
 * @returns {Promise<boolean>} True if a nearby complaint exists
 */
/**
 * Checks if a complaint exists within 50 meters of the current location
 * Uses Turf.js for geospatial calculations
 * @returns {Promise<boolean>} True if a nearby complaint exists
 */
async function locationProximity() {
  const point1 = turf.point([currentLongitude, currentLatitude]);
  const { data: dataPoints, error } = await supabase
    .from("complaints")
    .select("coordinates");
  if (error) {
    return false;
  }
  
  // Check each complaint's coordinates for proximity
  for (const complaint of dataPoints) {
    if (!complaint.coordinates) continue;
    const point2 = turf.point([complaint.coordinates.long, complaint.coordinates.lat]);
    const distance = turf.distance(point1, point2, { units: "kilometers" });
    if (distance < 0.05) { // 50 meters
      return true;
    }
  }
  return false;
}

/**
 * Checks if a similar complaint was submitted within the last 30 minutes
 * @returns {Promise<boolean>} True if a recent complaint exists
 */
async function timeWindowChecking() {
  const submissionTime = Date.now();
  const { data: submissionTimeList, error: retrievalError } = await supabase
    .from("complaints")
    .select("created_at")
    .order('created_at', { ascending: false })
    .limit(10); // Check only recent complaints

  if (retrievalError || !submissionTimeList) {
    return false;
  }

  for (const complaint of submissionTimeList) {
    const complaintTime = new Date(complaint.created_at).getTime();
    const diffMinutes = (submissionTime - complaintTime) / (1000 * 60);
    if (diffMinutes <= 30) { // Within last 30 minutes
      return true;
    }
  }
  return false;
}

async function titleAndDescriptionSimilarities() {
  const { data: complaints, error } = await supabase
    .from("complaints")
    .select("title, description")
    .order('created_at', { ascending: false })
    .limit(10);  // Check only recent complaints

  if (error || !complaints) return false;

  const currentTitle = title.value.toLowerCase();
  const currentDesc = description.value.toLowerCase();

  for (const complaint of complaints) {
    const titleSimilarity = stringSimilarity(currentTitle, complaint.title.toLowerCase());
    const descSimilarity = stringSimilarity(currentDesc, complaint.description.toLowerCase());

    if (titleSimilarity > 0.8 && descSimilarity > 0.8) {
      return true;
    }
  }
  return false;
}

// Helper function to calculate string similarity (Levenshtein distance based)
function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[str2.length][str1.length];
}

async function submitForm() {
  try {
    // Create the complaint record first
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert([{
        title: sanitizeInput(title.value),
        type: type.value,
        subCategory: subCategory.value,
        urgencyLevel: urgencyLevel.value,
        suggestedUnitDispatch: suggestedUnitDispatch.value,
        location: location.value,
        coordinates: { lat: currentLatitude, long: currentLongitude },
        description: sanitizeInput(description.value)
      }])
      .select()
      .single();

    if (complaintError) throw complaintError;

    // Upload any attached files
    const uploadPromises = [];
    for (const file of photo.files) {
      if (await validateFile(file)) {
        uploadPromises.push(uploadFile(file, complaint.id));
      }
    }

    const uploadResults = await Promise.all(uploadPromises);
    const failedUploads = uploadResults.filter(result => !result.success);    if (failedUploads.length > 0) {
      console.error('Some files failed to upload:', failedUploads);
    }

    // Clear the form
    form.reset();
    document.getElementById('imagesPlaceholder').innerHTML = '';
    // TODO: Replace with proper success dialog showing complaint ID and next steps
    alert('Complaint submitted successfully!');
  } catch (error) {
    console.error('Error submitting form:', error);
    // TODO: Replace with proper error dialog showing specific error details and recovery steps
    alert('Error submitting complaint. Please try again.');
  }
}

const getLocation = () => {
  return new Promise((resolve, reject) => {    if (!navigator.geolocation) {
      // TODO: Replace with proper error dialog suggesting browser upgrade or alternative location input methods
      alert("Geolocation is not supported by your browser");
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        currentLatitude = position.coords.latitude;
        currentLongitude = position.coords.longitude;
        console.log("Location acquired:", {
          lat: currentLatitude,
          lng: currentLongitude,
        });
        resolve(position);
      },
      // Error callback
      (error) => {
        switch (error.code) {          case error.PERMISSION_DENIED:
            // TODO: Replace with proper error dialog with instructions on enabling location access
            alert(
              "Location access was denied. Please enable location access in your browser settings to submit a complaint."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            // TODO: Replace with proper error dialog with manual location input form
            alert(
              "Location information is unavailable. Please try again or enter location manually."
            );
            break;
          case error.TIMEOUT:
            // TODO: Replace with proper error dialog suggesting connectivity troubleshooting
            alert(
              "Location request timed out. Please try again or check your connection."
            );
            break;
          default:
            // TODO: Replace with proper error dialog with technical support contact information
            alert("An unknown error occurred while getting location.");
        }
        console.error("Geolocation error:", error);
        reject(error);
      },
      // Options
      {
        enableHighAccuracy: true, // 10 seconds
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};


// Secure file upload function
/**
 * Securely uploads a file to Supabase storage and stores metadata
 * Includes sanitization, validation, and proper error handling
 * @param {File} file - The file to upload
 * @param {string} complainID - The ID of the associated complaint
 * @returns {Promise<string>} The file path in storage
 */
async function uploadFile(file, complainID) {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const filePath = `${complainID}/${sanitizedName}`;

    try {
        // Upload file to storage
        const { error: uploadError } = await supabase.storage
            .from("evidences")
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (uploadError) throw uploadError;

        // Store file metadata in evidenceImages table
        const { error: dbError } = await supabase
            .from('evidenceImages')
            .insert([{
                complaintID: complainID,
                filePath: filePath,
                uploadedAt: new Date().toISOString(),
                fileType: file.type,
                fileName: sanitizedName
            }]);

        if (dbError) throw dbError;
        
        return filePath;
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
}

// Initialize location when page loads
(async () => {
  try {
    await getLocation();
  } catch (error) {
    // If location fails, show manual location input
    const locationInput = document.getElementById("complaint-location");
    if (locationInput) {
      locationInput.required = true;
      locationInput.placeholder =
        "Enter location manually (required since automatic location is unavailable)";
    }
  }
})();
const { data, error } = await supabase.auth.signInWithPassword({
  email: "client@gmail.com",
  password: "14321432",
});
console.log(data);
console.log(error);
