import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import twilio from 'twilio';



// Start of Laura code. I believe this is related to notifications and not Twillo. Do not edit/ delete it. 
admin.initializeApp();
// EVENT 1: Notify contacts when a trip STARTS
export const onTripCreated = onDocumentCreated('trips/{tripId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const tripData = snapshot.data();
  if (!tripData) return;

  const { userName, destination, recipientTokens } = tripData;

  if (!recipientTokens || recipientTokens.length === 0) {
    console.log('No recipient tokens found for this trip.');
    return;
  }

  const payload = {
    notification: {
      title: '🚨 SafeLink: Trip Started',
      body: `${userName || 'A contact'} has started a trip to "${destination}".`,
    },
    data: {
      tripId: event.params.tripId,
      type: 'TRIP_START',
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: recipientTokens,
      notification: payload.notification,
      data: payload.data,
    });
    console.log(`Trip start notifications sent: ${response.successCount}`);
  } catch (error) {
    console.error('Error sending trip start notification:', error);
  }
});

// EVENT 2: Notify contacts when trip status changes to "ARRIVED"
export const onTripStatusUpdated = onDocumentUpdated('trips/{tripId}', async (event) => {
  if (!event.data) return;

  const dataBefore = event.data.before.data();
  const dataAfter = event.data.after.data();

  if (dataBefore?.status !== 'arrived' && dataAfter?.status === 'arrived') {
    const { userName, recipientTokens } = dataAfter;

    if (!recipientTokens || recipientTokens.length === 0) return;

    const payload = {
      notification: {
        title: '✅ SafeLink: Safe Arrival',
        body: `${userName || 'Your contact'} has safely arrived at their destination.`,
      },
      data: {
        tripId: event.params.tripId,
        type: 'TRIP_ARRIVED',
      },
    };

    try {
      await admin.messaging().sendEachForMulticast({
        tokens: recipientTokens,
        notification: payload.notification,
        data: payload.data,
      });
      console.log('Arrival notification sent successfully.');
    } catch (error) {
      console.error('Error sending arrival notification:', error);
    }
  }
});
// End of Laura code.

// Start of Arianna code on Twillo.
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN'); // Stored in Firebase
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID; // Stored in functions/env 
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Stored in functions/env 


export const sendTripStartSms = onDocumentCreated( // Cloud Firestore function triggers
  { document: 'trips/{tripId}', secrets: [twilioAuthToken] },
  async (event) => {
    const trip = event.data?.data();
    const client = twilio(twilioAccountSid, twilioAuthToken.value());
    try {
      // 'Send SMS and MMS messages' Doc from Twillo
      const message = await client.messages.create({
        body: `SafeLink: I have just started a trip to ${trip?.destination || 'my destination'}. Follow my journey: https://safelinkwatcher.com/watch/${event.params.tripId}`,
        from: twilioPhoneNumber,
        to: trip?.recipientPhone,
      });
      console.log(message.body);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }
);

export const sendTripArrivedSms = onDocumentUpdated(  // Cloud Firestore function triggers
  { document: 'trips/{tripId}', secrets: [twilioAuthToken] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (before?.status === 'arrived' || after?.status !== 'arrived') return;
    const client = twilio(twilioAccountSid, twilioAuthToken.value());
    try {
      // 'Send SMS and MMS messages' Doc from Twillo
      const message = await client.messages.create({
        body: 'SafeLink: I have successfully arrived at my destination!',
        from: twilioPhoneNumber,
        to: after?.recipientPhone,
      });
      console.log(message.body);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }
);