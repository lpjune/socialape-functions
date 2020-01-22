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
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
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
            .catch(err => {
                console.error(err);
            });
    });

exports.deleteNotificationOnUnlike = functions.firestore
    .document("likes/{id}")
    .onDelete(snapshot => {
        return db
            .doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.createNotificationOnComment = functions.firestore
    .document("comments/{id}")
    .onCreate(snapshot => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then(doc => {
                if (
                    doc.exists &&
                    doc.data().userHandle !== snapshot.data().userHandle
                ) {
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
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.onUserImageChange = functions.firestore
    .document("/users/{userId}")
    .onUpdate(change => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log("image has changed");
            let batch = db.batch();
            return db
                .collection("screams")
                .where("userHandle", "==", change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, {
                            userImage: change.after.data().imageUrl
                        });
                    });
                    return batch.commit();
                });
        } else return true;
    });

exports.onScreamDelete = functions
    .region("europe-west1")
    .firestore.document("/screams/{screamId}")
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db
            .collection("comments")
            .where("screamId", "==", screamId)
            .get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db
                    .collection("likes")
                    .where("screamId", "==", screamId)
                    .get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                });
                return db
                    .collection("notifications")
                    .where("screamId", "==", screamId)
                    .get();
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
            })
            .catch(err => console.error(err));
    });
