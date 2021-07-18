let google = document.querySelector("#gbtn");

google.addEventListener("click", loginwithgoogle);

function loginwithgoogle() {
    let provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function(result) {
      
      let user = result.user;
        console.log(user);
        console.log("email ",user.email);
        console.log("photo ",user.photoURL);
        console.log("name ",user.displayName);
        window.location.replace("./msg.html");
       
      }).catch(function(error) {
       console.log(error);
      });
}

