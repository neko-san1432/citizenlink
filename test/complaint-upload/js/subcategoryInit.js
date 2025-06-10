const category = document.getElementById("complaint-type");
const subcategory = document.getElementById("complaint-subcategory");
category.addEventListener("change", () => {
    updateSubcategories()
});
function updateSubcategories() {
  switch (category.value) {
    case "infrastructure":
      subcategory.innerHTML = `
    <option value="Potholes / Road damage">Potholes / Road damage</option>
    <option value="Broken sidewalks">Broken sidewalks</option>
    <option value="Damaged streetlights">Damaged streetlights</option>
    <option value="Collapsing structures">Collapsing structures</option>
    <option value="Bridge issues">Bridge issues</option>
    <option value="Construction obstructions">Construction obstructions</option>
    <option value="Traffic sign damage">Traffic sign damage</option>
    <option value="Flooded roads / drainage issues">Flooded roads / drainage issues</option>`;
      break;
    case "public_safety":
      subcategory.innerHTML = `
    <option value="Suspicious activity">Suspicious activity</option>
    <option value="Theft / Robbery">Theft / Robbery</option>
    <option value="Assault reports">Assault reports</option>
    <option value="Drug-related concerns">Drug-related concerns</option>
    <option value="Vandalism">Vandalism</option>
    <option value="Stray animals / rabid animals">Stray animals / rabid animals</option>
    <option value="Trespassing">Trespassing</option>
    <option value="Missing persons">Missing persons</option>`;
      break;
    case "sanitation":
      subcategory.innerHTML = `
    <option value="Uncollected garbage">Uncollected garbage</option>
    <option value="Illegal dumping">Illegal dumping</option>
    <option value="Clogged drainage">Clogged drainage</option>
    <option value="Overflowing trash bins">Overflowing trash bins</option>
    <option value="Pest infestation (rats, insects, etc.)">Pest infestation (rats, insects, etc.)</option>
    <option value="Dead animals">Dead animals</option>
    <option value="Improper waste disposal">Improper waste disposal</option>
    <option value="Foul odor reports">Foul odor reports</option>`;
      break;
    case "utilities":
      subcategory.innerHTML = `
    <option value="Power outage">Power outage</option>
    <option value="Water supply issues">Water supply issues</option>
    <option value="Leaking pipes">Leaking pipes</option>
    <option value="Gas leaks">Gas leaks</option>
    <option value="Faulty electrical poles/wires">Faulty electrical poles/wires</option>
    <option value="Internet/cable service disruptions">Internet/cable service disruptions</option>
    <option value="Water quality concern">Water quality concern</option>
    <option value="Sewer backup">Sewer backup</option>`;
      break;
    case "noise":
      subcategory.innerHTML = `
    <option value="Loud music (e.g., parties, karaoke)">Loud music (e.g., parties, karaoke)</option>
    <option value="Barking dogs">Barking dogs</option>
    <option value="Construction noise">Construction noise</option>
    <option value="Vehicle noise (revving, horns)">Vehicle noise (revving, horns)</option>
    <option value="Industrial/factory noise">Industrial/factory noise</option>
    <option value="Noise at restricted hours">Noise at restricted hours</option>
    <option value="Public disturbance">Public disturbance</option>`;
      break;
    default:
      subcategory.innerHTML = `<option value="" disabled selected>Select subcategory</option>`;
      break;
  }
}
