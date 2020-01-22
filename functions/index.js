const functions = require("firebase-functions");
const app = require("express")();
const firebase = require("firebase");
const FBAuth = require("./util/fbAuth");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser
} = require("./handlers/users");

// Scream routes
// Get all screams
app.get("/screams", getAllScreams);
// Post one scream
app.post("/scream", FBAuth, postOneScream);

// User routes
// Sign up route
app.post("/signup", signup);
// Login route
app.post("/login", login);
// image upload route
app.post("/user/image", FBAuth, uploadImage);
// Add user details route
app.post("/user", FBAuth, addUserDetails);
// Get user details
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
