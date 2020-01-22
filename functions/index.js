const functions = require("firebase-functions");
const app = require("express")();
const firebase = require("firebase");
const FBAuth = require("./util/fbAuth");
const { db } = require("./util/admin");

const {
    getAllScreams,
    postOneScream,
    getScream,
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require("./handlers/screams");
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require("./handlers/users");

// Scream routes
// Get all screams
app.get("/screams", getAllScreams);
// Post one scream
app.post("/scream", FBAuth, postOneScream);
// Get scream
app.get("/scream/:screamId", getScream);
// Delete scream
app.delete("/scream/:screamId", FBAuth, deleteScream);
// Like a scream
app.get("/scream/:screamId/like", FBAuth, likeScream);
// // Unlike a scream
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
// Post comment on scream
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

// User routes
// Sign up route
app.post("/signup", signup);
// Login route
app.post("/login", login);
// Image upload route
app.post("/user/image", FBAuth, uploadImage);
// Add user details route
app.post("/user", FBAuth, addUserDetails);
// Get this users details route
app.get("/user", FBAuth, getAuthenticatedUser);
// Get user details route
app.get("/user/:handle", getUserDetails);
// Mark notification as read route
app.post("/notifications", FBAuth, markNotificationsRead);


exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
    .document("likes/{id}")
    .onCreate(snapshot => {
        db.doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: "like",
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.deleteNotificationOnUnlike = functions.firestore
    .document("likes/{id}")
    .onDelete(snapshot => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.createNotificationOnComment = functions.firestore
    .document("comments/{id}")
    .onCreate(snapshot => {
        db.doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: "comment",
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });
