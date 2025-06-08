import { supabase } from "../../../js/api/database.js";
const title = document.getElementById("complaint-title");
const type = document.getElementById("complaint-type");
const subCategory = document.getElementById("complaint-subcategory");
const urgencyLevel = document.getElementById("complaint-urgency");
const suggestedUnitDispatch = document.getElementById("suggested-unit");
const location = document.getElementById("complaint-location");
const decription = document.getElementById("complaint-description");
//tentative
const photo = document.getElementById("complaint-photo");

//buttons
const submit_form = document.getElementById("submit");
const cancel = document.getElementById("cancel-btn");

const latitude = 0
const longitude = 0
submit_form.addEventListener("click", async () => {
  formChecker();
  submitForm();
});
cancel.addEventListener("click", () => {
  //going to the base
});

async function formChecker() {}
async function submitForm() {}
function getLocation() {
  if (!navigator.geolocation) {
    //error message showing the browser doesn't support geolocation
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  });
}
