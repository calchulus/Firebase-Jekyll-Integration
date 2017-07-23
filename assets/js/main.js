//Presence System - Firebase.
function updateStatus(userRef)
{
    var amOnline = database.ref('.info/connected');
    amOnline.on('value', function(snapshot) {
        if (snapshot.val()) {
            //var sessionRef = userRef.push();
            //sessionRef.child('ended').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
            //sessionRef.child('began').set(firebase.database.ServerValue.TIMESTAMP);

            userRef.child('status').set('online');
            userRef.child('status').onDisconnect().set('offline');

            userRef.child('lastseen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

            userRef.child('isOnline').set(true);
            userRef.child('isOnline').onDisconnect().set(false);
        }
    });
    var idle = new Idle({
        onHidden: function(){userRef.child('status').set('away');},
        onVisible: function(){userRef.child('status').set('online');},
        onAway: function(){userRef.child('status').set('inactive');},
        onAwayBack: function(){userRef.child('status').set('online');},
        awayTimeout: 20000 //away with 20 seconds of inactivity
    }).start();
    /*
    Font Awesome statuses:
    - Online: check_circle
    - Offline: cancel
    - Idle: error
    */
}
function onlineList(olRef)
{
    var amOnline = database.ref('.info/connected');
    amOnline.on('value', function(snapshot) {
        if (snapshot.val()) {
            olRef.child('o').set('true');
            if (!u.isAnonymous)
            {
                olRef.child('m').set('true');
            }
            else {
                olRef.child('m').set('false');
            }
        }
    });
    olRef.onDisconnect().remove();
}
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        /*var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;
        */
        window.u = user;
        updateStatus(database.ref('presence/' + u.uid));
        onlineList(database.ref('online/' + u.uid));
        pageScript();
    } else {
        //Anonymously sign in.
        firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
            console.log(errorCode + ": " + errorMessage);
        });
    }
});