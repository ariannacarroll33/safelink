import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

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