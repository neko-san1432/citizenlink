//....................................
//==============T=A=S=K===============
//1.fix any vulnerabilities
//2.
//====================================
//....................................
import { supabase } from "../../../js/api/database.js";
const title = document.getElementById("complaint-title");
const type = document.getElementById("complaint-type");
const subCategory = document.getElementById("complaint-subcategory");
const urgencyLevel = document.getElementById("complaint-urgency");
const suggestedUnitDispatch = document.getElementById("suggested-unit");
const location = document.getElementById("complaint-location");
const description = document.getElementById("complaint-description");
//tentative
const photo = document.getElementById("complaint-photo");

//buttons
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

// File validation function
function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    alert(`File ${file.name} is too large. Maximum size is 5MB`);
    return false;
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    alert(
      `File ${file.name} has invalid type. Allowed types are: JPEG, PNG, GIF, WebP`
    );
    return false;
  }

  // Check file creation/modification time
  const currentTime = new Date().getTime();
  const fileTime = file.lastModified;
  const timeDifference = (currentTime - fileTime) / (1000 * 60 * 60); // Convert to hours

  if (timeDifference > 1) {
    alert(
      `File ${file.name} is too old. Please upload images taken within the last hour.`
    );
    return false;
  }

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
function handleFiles(fileList) {
  const files = Array.from(fileList);
  const imagesPlaceholder = document.getElementById("imagesPlaceholder");

  files.forEach((file, index) => {
    if (validateFile(file)) {
      displayImage(file, index);
    }
  });
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

// Handle file input change
photo.addEventListener("change", (e) => {
  const files = e.target.files;
  handleFiles(files);
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

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.style.backgroundColor = "transparent";

  const dt = e.dataTransfer;
  const files = dt.files;

  handleFiles(files);

  files.forEach((file, index) => {
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
  });
});

async function formChecker() {
  const tester = new RegExp(`\\b(${bannedWords.join("|")})\\b`, "i");
  const titleCheck = tester.test(title.value);
  const descriptionCheck = tester.test(description.value);
  if (titleCheck || descriptionCheck) {
    alert("Banned words detected");
    return;
  }
  if (
    title.value === "" ||
    description.value === "" ||
    (type.value === "" && subCategory.value === "") ||
    urgencyLevel.value === "" ||
    suggestedUnitDispatch.value === "" ||
    location.value === ""
  ) {
    alert("Empty required fields detected");
    return;
  }
  //duplication criteria: location proximity, time window check
  if (
    (await locationProximity()) &&
    (await timeWindowChecking()) &&
    (await titleAndDescriptionSimilarities())
  ) {
    alert("Duplicate complaint");
    return;
  }
  //if passed all
  submitForm();
}

async function locationProximity() {
  const point1 = turf.point([longitude, latitude]);
  const { data: dataPoints, error } = await supabase
    .from("complaints")
    .select("coordinates");
  if (error) {
    //tentative lang
    return false;
  }
  // dataPoints.coordinates is a "{}" datatype that "long" and "lat" are the keys
  for (const coord in dataPoints.coordinates) {
    const point2 = turf.point([coord.long, coord.lat]);
    const distance = turf.distance(point1, point2, { units: "kilometers" });
    if (distance < 0.05) {
      return true;
    }
  }
  return false;
}

async function timeWindowChecking() {
  //comparing time
  const submissionTime = Date.now();
  const { data: submissionTimeList, error: retrievalError } = await supabase
    .from("complaints")
    .select("created_at");
  if (retrievalError) {
    return false;
  }
  for (const time in submissionTimeList) {
    const diff = (time.submissionTime - submissionTime) / (1000 * 60);
    if (time.submissionTime >= submissionTime && diff <= 30) {
      return true;
    }
  }
  return false;
}

async function titleAndDescriptionSimilarities() {
  //likeness scoring
  const score = 0;
  const currentTitle = title.value.toLowerCase();
  const currentDescription = description.value.toLowerCase();
  const { data, error: retrievalError } = await supabase
    .from("complaints")
    .select("title,description");
  if (retrievalError) {
    //error
  }
  for (const x in data.title) {
    const w = x.toLowerCase();
    const a = stringSimilarity.compareTwoString(w, currentTitle);
    if (a > 0.55) {
    }
  }
  for (const y in data.description) {
    const z = y.toLowerCase();
    const b = stringSimilarity.compareTwoString(z, currentDescription);
    if (b > 0.55) {
    }
  }
  return false;
}

async function submitForm() {
  const { data, error: formSubmissionError } = await supabase
    .from("complaints")
    .insert([
      {
        title: title.value,
        urgency: urgencyLevel.value,
        type: type.value,
        description: description.value,
        subCategory: subCategory.value,
        location: location.value,
        suggestedUnitDispatch: suggestedUnitDispatch.value,
        user: await getUser(),
        //tentative for privacy
        complaintLocation: {
          userLatitude: currentLongitude,
          userLongitude: currentLatitude,
        },
      },
    ]);
  if (formSubmissionError) {
    alert("Error uploading complaint: " + (await formSubmissionError));
  }
  const files = Array.from(photo.files);
  if (files.length != 0) {
    for (const file of files) {
      const { error: photoUploadError } = await supabase.storage
        .from("evidence")
        .upload(`${data.complainID}/${file.name}`, file);
      if (photoUploadError) {
        alert("Error upload media: " + photoUploadError);
      }
    }
  }
}
function sanitizeInput(input) {
  return DOMPurify.sanitize(input);
}
const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        currentLatitude = position.coords.latitude;
        currentLongitude = position.coords.longitude;
        console.log("Location acquired:", { lat: currentLatitude, lng: currentLongitude });
        resolve(position);
      },
      // Error callback
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location access was denied. Please enable location access in your browser settings to submit a complaint.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable. Please try again or enter location manually.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Please try again or check your connection.");
            break;
          default:
            alert("An unknown error occurred while getting location.");
        }
        console.error("Geolocation error:", error);
        reject(error);
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,        // 10 seconds
        maximumAge: 300000     // 5 minutes
      }
    );
  });
};

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.log("Unauthorized user");
    return;
  }  return data.id;
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
      locationInput.placeholder = "Enter location manually (required since automatic location is unavailable)";
    }
  }
})()
