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
const latitude = 0;
const longitude = 0;
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

form.addEventListener("submit", async () => {
  formChecker();
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
photo.addEventListener("change", () => {});

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
    locationProximity() &&
    timeWindowChecking() &&
    titleAndDescriptionSimilarities()
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
    .select("submissionTime");
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
    .from("")
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
        subCategory: subCategory.value,
        location: location.value,
        suggestedUnitDispatch: suggestedUnitDispatch.value,
        user: getUser(),
      },
    ]);
  if (formSubmissionError) {
    alert("Error uploading complaint: ", formSubmissionError);
  }
  const files = Array.from(input.files);
  if (files.length != 0) {
    for (const file of files) {
      const { error: photoUploadError } = await supabase.storage
        .from("evidence")
        .upload(`${data.complainID}/${file.name}`, file);
      if (photoUploadError) {
        alert("Error upload media: ", photoUploadError);
      }
    }
  }
}
function getLocation() {
  if (!navigator.geolocation) {
    alert("Unsupported browser");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  });
}
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.log("Unauthorized user");
    return;
  }
  return data.id;
}
getLocation();
