const config = require('../config/index');

let client;
try {
  const twilio = require('twilio');
  if (config.twilio.accountSid && config.twilio.authToken) {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
} catch (e) {
  // twilio optional
}

async function sendOtp(mobileNumber, code) {
  try {
    if (client && config.twilio.verifyServiceSid) {
      await client.messages.create({
        body: `Your SiteTrack code is: ${code}`,
        to: mobileNumber
      });
      return { success: true };
    } else {
      console.log('[OTP DEV]', mobileNumber, code);
      return { success: true };
    }
  } catch (error) {
    console.error('[OTP ERROR]', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOtp };
