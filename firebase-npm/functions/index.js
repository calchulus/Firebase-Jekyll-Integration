// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const CryptoJS = require("crypto-js");
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
/*exports.helloWorld = functions.https.onRequest((request, response) => {
response.send("Hello from Firebase!");
});*/
/*exports.addUser = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const fname = req.query.fname;
    const lname = req.query.lname;
    const gradyear = req.query.gradyear;
    const _nimad = req.query._nimad;
    const username = fname.toString().substr(0, 1) + lname.toString() + gradyear.toString().slice(-2);
    const email = username + "@kamsc.org";
    admin.auth().createUser({
        uid: username,
        email: email,
        emailVerified: false,
        password: "KAMSCstudent#"+gradyear.toString().slice(-2)+"!",
        displayName: fname + "_" + lname + "_" + gradyear + _nimad,
        disabled: false
    })
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
    })
    .catch(function(error) {
        console.log("Error creating new user:", error);
    });
    res.send("Added user: "+username+", "+fname+ " " + lname + " with grad year "+gradyear);
});*/
/*exports.createUserData = functions.auth.user().onCreate(event => {
const user = event.data;
const displayName = user.displayName;
const d = displayName.split("_");
const fname = d[0]
const lname = d[1]
const gradyear = d[2]
const _nimad = d[3]
console.log(d);
});*/

exports.createUser = functions.database.ref('/users/{username}').onCreate(event => {
    // Grab the current value of what was written to the Realtime Database.
    const dat = event.data;
    //console.log(dat);
    //console.log(dat.child("gradyear").val());
    //console.log(dat.child("fname").val());
    //console.log(dat.child("lname").val());
    //console.log(dat.child("_nimad").val());

    const fname = dat.child("fname").val();
    const lname = dat.child("lname").val();
    const gradyear = dat.child("gradyear").val();
    const _nimad = dat.child("_nimad").val();
    //const username = fname.toString().substr(0, 1) + lname.toString() + gradyear.toString().slice(-2);
    const email = event.params.username + "@kamsc.org";
    const password = "KAMSCstudent#"+fname.toString().substr(0, 1)+lname.toString().substr(0, 1)+gradyear.toString().slice(-2)+"!";
    admin.auth().createUser({
        uid: event.params.username,
        email: email,
        emailVerified: false,
        password: password,
        displayName: fname + " " + lname,
        disabled: false
    })
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
    })
    .catch(function(error) {
        console.log("Error creating new user:", error);
    });
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    const nimadRef = event.data.adminRef.root.child('_nimad').child(event.params.username);
    const ukRef = event.data.adminRef.root.child('u-k').child(event.params.username);
    return event.data.ref.child('email').set(email).them(() => {
        return nimadRef.set(_nimad).then(() => {
            return event.data.ref.child('_nimad').remove().then(() => {
                return ukRef.set(CryptoJS.AES.encrypt(JSON.stringify({'username': event.params.username, 'password': password}), password).toString());
            });
        });
    });
});

exports.changePasswordInternal = functions.database.ref('/users/{username}/password').onCreate(event => {
    const ukRef = event.data.adminRef.root.child('u-k').child(event.params.username);
    console.log("***Changing password for " + event.params.username + "... to " + event.data.val().toString()+"***");
    admin.auth().updateUser(event.params.username, {password: event.data.val().toString()})
    .then(() => {
        return ukRef.set(CryptoJS.AES.encrypt(JSON.stringify({'username': event.params.username, 'password': event.data.val().toString()}), event.data.val()).toString())
        .then(() => {
            console.log("Changing password done.");
            return event.data.ref.remove();
        });
    });
});

exports.checkPasswordRespEmail = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        //console.log(request.body);
        const ukRef = admin.database().ref('u-k').child(request.body.username);
        return ukRef.once('value', (snapshot) => {
            const event = snapshot.val();
            try {
                const pass = CryptoJS.AES.decrypt(request.body.password.toString(), 'KAMCh0m3!9455W0RD');
                const dD = JSON.parse(CryptoJS.AES.decrypt(event.toString(), pass.toString(CryptoJS.enc.Utf8)).toString(CryptoJS.enc.Utf8));
                if (dD.username && dD.password){
                    return admin.database().ref('users/'+dD.username).child('email').once('value', (snapshot) => {
                        console.log('Authentication passed for user ' + dD.username);
                        response.send(snapshot.val());
                    });
                }
            } catch(error) {
                console.log('Authentication failed for user ' + request.body.username);
                response.status(455).send();
            }
            //response.set('Access-Control-Allow-Origin', "*");
            //response.set('Access-Control-Allow-Methods', 'GET, POST');

            //response.send(dD.toString());
            //response.send(JSON.stringify(dD));
        });
    });
});

exports.deleteUser = functions.database.ref('/users/{username}').onDelete(event => {
    admin.auth().deleteUser(event.params.username)
    .then(function() {
        console.log("Successfully deleted user " + event.params.username);
    })
    .catch(function(error) {
        console.log("Error deleting user " + event.params.username + ":", error);
    });
    console.log("Now Deleting data...");
    const nimadRef = event.data.adminRef.root.child('_nimad').child(event.params.username);
    const ukRef = event.data.adminRef.root.child('u-k').child(event.params.username);
    return nimadRef.remove().then(() => {
        return ukRef.remove().then(() => {
            console.log("Done deleting data for user.");
        });
    });
});