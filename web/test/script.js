// Replace with your Supabase keys
import { supabase } from '../js/api/database.js';
let currentPhone = null;

async function sendOTP() {
  const phone = document.getElementById('phone').value;
  log(`Sending OTP to ${phone}...`);

  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    log(`❌ Error sending OTP: ${error.message}`);
  } else {
    log(`✅ OTP sent to ${phone}`);
    currentPhone = phone;
  } 
}

async function verifyOTP() {
  const token = document.getElementById('otp').value;
  if (!currentPhone) {
    log("⚠️ No phone number recorded. Please send OTP first.");
    return;
  }
  const { data, error } = await supabase.auth.verifyOtp({
    phone: currentPhone,
    token,
    type: 'sms'
  });

  if (error) {
    log(`❌ Error verifying OTP: ${error.message}`);
  } else {
    log(`✅ OTP verified. Logged in as: ${JSON.stringify(data.user)}`);
  }
}

function log(message) {
  document.getElementById('log').innerText = message;
}
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;