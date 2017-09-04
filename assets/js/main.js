//Presence System - Firebase.
function updateStatus(userRef)
{
    var amOnline = database.ref('.info/connected');
    amOnline.on('value', function(snapshot) {
        if (snapshot.val()) {
            //var sessionRef = userRef.push();
            //sessionRef.child('ended').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
            //sessionRef.child('began').set(firebase.database.ServerValue.TIMESTAMP);

            userRef.child('status').onDisconnect().set('offline');
            userRef.child('status').set('online');

            userRef.child('lastseen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

            userRef.child('isOnline').onDisconnect().set(false);
            userRef.child('isOnline').set(true);
        }
    });
    var idle = new Idle({
        onHidden: function(){userRef.child('status').onDisconnect().set('offline'); userRef.child('status').set('away');},
        onVisible: function(){userRef.child('status').onDisconnect().set('offline'); userRef.child('status').set('online');},
        onAway: function(){userRef.child('status').onDisconnect().set('offline'); userRef.child('status').set('inactive');},
        onAwayBack: function(){userRef.child('status').onDisconnect().set('offline'); userRef.child('status').set('online');},
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
            olRef.onDisconnect().remove();
            olRef.child('o').set('true');
            if (!u.isAnonymous)
            {
                olRef.onDisconnect().remove();
                olRef.child('m').set('true');
            }
            else {
                olRef.onDisconnect().remove();
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
        setLoginInfo();
        checkAcc('_nimad/' + u.uid);
    } else {
        //Anonymously sign in.
        firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            var errorMessage = error.message;
            console.log(errorMessage);
        });
    }
});
function setLoginInfo()
{
    if (window.u) {
        if (!window.u.isAnonymous) {
            $("#log-in-out").append('<li><a href="../manage-profile"><span class="tab">Manage Profile</span></a></li>');
            $("#log-in-out").append('<li><a href="../logout"><span class="tab">Logout</span></a></li>');
        }
        else {
            $("#log-in-out").append('<li><a href="../login"><span class="tab">Login</span></a></li>');
            if (location.href.indexOf("/login") <= -1)
            {
                location.replace("../login");
            }
        }
    }
    else {
        $("#log-in-out").append('<li><a href="../login"><span class="tab">Login</span></a></li>');
        if (location.href.indexOf("/login") <= -1)
        {
            location.replace("../login");
        }
    }
}
function checkAcc(adRef)
{
    var ad = database.ref(adRef);
    ad.once('value', function(snapshot) {
        if (snapshot.val() !== null) {
            //console.log(snapshot.val() == true);
            console.log("Checking admin started...");
            if (snapshot.val() === true) {
                navedit(snapshot.val());
            }
            pageScript(snapshot.val());
            console.log("Checking admin done.");
        }
        else {
            console.log("Admin val is null.");
            pageScript(null);
        }
    });
}
function navedit(_nimad)
{
    if (_nimad) {
        $("#nav-items").append('<li id="n4"><a href="addusers.html"><i class="material-icons text-gray">person_add</i><p>Add Users</p></a></li>');
    }
}
function hideOverlay() {
    setTimeout(function(){$(".loader-overlay").css('opacity','0');}, 100);
    setTimeout(function(){$(".wrapper").css('display','block');}, 100);
    setTimeout(function(){$(".loader-overlay").css('z-index','-1');}, 500);
}
function setActive(ind) {
    $('#n'+ind).attr('class', 'active');
}