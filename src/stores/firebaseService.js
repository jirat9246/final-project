import { doc, getDoc, getFirestore } from 'firebase/firestore'

const db = getFirestore()

const fetchDataByRoleAndId = async (role, id) => {
  if (!id) {
    console.error('ID ไม่ถูกต้องหรือไม่ได้รับค่า')
    return null
  }
  try {
    let data
    if (role === 'guide') {
      const guideDocRef = doc(db, 'guides', id)
      const guideSnapshot = await getDoc(guideDocRef)
      if (guideSnapshot.exists()) {
        data = guideSnapshot.data()
      } else {
        console.error('ไม่พบข้อมูลไกด์')
      }
    } else if (role === 'user') {
      const userDocRef = doc(db, 'users', id)
      const userSnapshot = await getDoc(userDocRef)
      if (userSnapshot.exists()) {
        data = userSnapshot.data()
      } else {
        console.error('ไม่พบข้อมูลผู้ใช้')
      }
    }
    return data
  } catch (error) {
    console.error(`Error fetching ${role} data:`, error)
    return null
  }
}


export default fetchDataByRoleAndId
