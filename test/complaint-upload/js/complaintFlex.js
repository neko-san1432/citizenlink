import { supabase } from "../../../js/api/database.js"
const complaintHolder = document.getElementById("complaintList")

async function getComplaints() {
    const { data, error } = await supabase.from("complaints").select("*")
    if (error) {
        console.error("Error fetching complaints:", error);
        return;
    }

    data.forEach((complaint, index) => {
        // Create unique ID for the button
        const buttonId = `viewBtn_${index}`;
        
        // Add the HTML content including the button with unique ID
        complaintHolder.innerHTML += `
            <div class="complaint-card">
                <h3>${complaint.title}</h3>
                <p>${complaint.description}</p>
                <button id="${buttonId}" class="view-btn">View Details</button>
            </div>
        `;

        // Add event listener after the element is added to DOM
        // We need to do this after innerHTML because innerHTML removes existing event listeners
        setTimeout(() => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => handleViewClick(complaint));
            }
        }, 0);
    });
}

// Handler function for the button click
function handleViewClick(complaint) {
    console.log('Viewing complaint:', complaint);
    // Add your view logic here
    alert(`Viewing complaint: ${complaint.title}`);length
    document.getElementById("")
}

// Call getComplaints when the page loads
document.addEventListener('DOMContentLoaded', getComplaints);