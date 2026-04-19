const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem criar usuários"
    );
  }

  const { email, password, name, role, studentId } = data;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      name: name,
      email: email,
      role: role,
      studentId: studentId || null,
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("unknown", error.message);
  }
});