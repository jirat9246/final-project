import * as functions from 'firebase-functions'
import { initializeApp } from 'firebase-admin'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()

// Sync user data to guides collection
export const syncUserToGuide = functions.firestore.document('users/{userId}').onWrite(async (change, context) => {
    const userId = context.params.userId

    // If the user document is deleted, remove from guides
    if (!change.after.exists) {
        await getFirestore().collection('guides').doc(userId).delete()
        return null
    }

    const newUserData = change.after.data()
    const guideData = {
        email: newUserData.email || '',
        displayName: newUserData.displayName || '',
        profileImage: newUserData.profileImage || '',
        role: newUserData.role || 'user',
        status: newUserData.status || 'inactive',
        uid: newUserData.uid || userId,
        isActive: newUserData.isActive || false,
        updatedAt: FieldValue.serverTimestamp()
    }

    await getFirestore().collection('guides').doc(userId).set(guideData, { merge: true })
})
