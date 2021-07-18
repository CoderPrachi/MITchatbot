let url;
let storeMsg;
var db = firebase.firestore();
//alert("in msg js");
let host__id;
let logout__btn = document.getElementById("lg");
let profile = document.querySelectorAll("#profile");//jithe jithe id match hoil tya saglya var kam karel

let uname = document.querySelector("#acc_name");
let msg__sendBtn = document.querySelector("#msg__send");
let msg__clearBtn = document.querySelector("#msg__clear");

let user__name;
let user__profile;
let mail__verified;

let stored__msg=""; //to store msges to send for sentimental analysis
let counter=0;

let showM = document.querySelector("#chatmsg");
let show__senti = document.querySelector("#senti");
let senti__visible = 0;

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log('already login');
      //console.log(user);
      host__id=user.email;
      user__profile=user.photoURL;
      mail__verified=user.emailVerified;
      if(mail__verified==true){
          profile.src=user__profile;

          profile.forEach(item => {item.src=user.photoURL});
          
          let html=`<div><p id="name" style="font-weight: bold; color:black;margin-top:10px;margin-bottom:30px">${user.displayName}</p></div>`;
        uname.insertAdjacentHTML("afterbegin",html);
        //show chats
        db.collection(host__id).orderBy("timestamp", "asc").onSnapshot(function(snapshot) {
          snapshot.docChanges().forEach(function(change){
            if(change.type === 'added'){
              //ithe te card banvaycha code ahe jyavar apan msg show karto
              //aple msg start
              if(host__id==change.doc.data().email){
               stored__msg = stored__msg+" "+change.doc.data().message;
              
              let Message = `
            
              <div class="chatmessages chat d-flex align-items-center mine">
                <img class="rounded-circle" src="${change.doc.data().photo}" width="40px"  alt="">
                <p style="margin:0px 10px;padding:0px">${change.doc.data().message}</p>
              </div>
            
        
              `;
        
             
              // console.log(html);
              showM.insertAdjacentHTML("afterbegin",Message);
              console.log("CHECK "+stored__msg);
              }
              //aple msg end
        
              //dusryanche msg start
              if(!(host__id==change.doc.data().email)){
                console.log("nahi zal match");
             
              let Message = `
              <div class="chatmessages chat d-flex align-items-center others">
                <img class="rounded-circle" src="${change.doc.data().photo}" alt="">
                <p style="margin-left:100px;padding:0px;">${change.doc.data().message}</p>
              </div>
              `;                      
              showM.insertAdjacentHTML("afterbegin",Message);
                  
              }
              //dusryanche msg end
              
        
            }
          })
        })
        //show chat end
     
      }

    } else {
        console.log('vapas aloy index var login nahi barobar mhanun');
     window.location.replace("./index.html");
    }
  });
//logout code
logout__btn.addEventListener("click",logoutMe);

function logoutMe(){
    firebase.auth().signOut();
}

//for sending msg 
msg__sendBtn.addEventListener("click",sendFunction);//send button cha id ghetla varti ani tyavar ithe event takli

//button click zalyavar sendFunction call honar ahe
function sendFunction() {
  //alert("pathavlela msg");
  //variable madhe msg ghyaycha txt box madhun
  let msg__text = document.getElementById("msg__text");//msg read kela pahile html page varcha
  if(msg__text==" "){
    return;//msg khali asel tr direct return
  }


    // code to check userr is logged in or not
if(!(msg__text=="")){
      
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {//ithparyant aal mhanje user logged in ahech
    console.log('already login');
    
    host__id=user.email;
   //ata msg store karnyacha code suru zala
    
    db.collection(host__id)
    .add({
      message: msg__text.value,
      username: user.displayName,
      email:user.email,
      photo:user.photoURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(function (docRef) {
     
      //python file madhe ithun msg pathavaycha n tithe input_msg initialize karaycha
      url= "http://127.0.0.1:5000/msgIn/";
      let txt = msg__text.value;
      final_url = url.concat(txt);
      
      //chat bot la msg pathvun tyacha response ghene __start
      fetch(final_url)
      .then((res) => res.json())
      .then((data) => {
        
          
       
          let otherMsg =`
          
          <div class="chatmessages chat d-flex align-items-center others" style="width:60%;overflow:hidden;">
         
          <p style="margin:0px 10px;padding:0px;">
          <img src="https://source.unsplash.com/random/35x35">
          <b>${data.msg1}</b></p>
        </div>
          `;
          //showM.insertAdjacentHTML("afterbegin",otherMsg);
          
        
      
      //end
      //other msg=>firestore
      db.collection(host__id)
    .add({
      message: otherMsg,
      username: "chatbot",
      email:"chatbot@gmail.cpm",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(function (docRef) {
      console.log("other msg stored to"+host__id);
      counter++;
      console.log("counter===="+counter);
        //=================for sentiment part
        if(!(stored__msg=="") && counter==5){
          let url2= "http://127.0.0.1:5000/msgAnalysis/";
          
          let final_url2 = url2.concat(stored__msg);
          let otherMsg = "";
          //chat bot la msg pathvun tyacha response ghene __start
          fetch(final_url2)
          .then((res) => res.json())
          .then((data) => {
            console.log("sentiment####"+data.msgSenti);
            //star dakhavaycha part
            if(data.msgSenti > 0.5){
              otherMsg = `
              <div class="rating" id="ch">
              <i class="fa fa-star" aria-hidden="true"style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true"style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
            </div>
                            `;
              
            }
            else
            if(data.msgSenti > 0.1){
              otherMsg = `
              <div class="rating" id="ch">
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
            </div>
                            `;
            }
            else
            if(data.msgSenti < -0.1){
              otherMsg = `
              <div class="rating" id="ch">
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
            </div>
                            `;
            }
            else{
              otherMsg = `
              <div class="rating" id="ch">
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
              <i class="fa fa-star-o" aria-hidden="true" style="font-size:30px;color:red"></i>
            </div>
                            `;
            }



            disD = document.getElementById('ch');
            if(senti__visible == 1){
            disD.style.display = "none";
            senti__visible = 0;
            }
            senti.insertAdjacentHTML("afterbegin",otherMsg);
              
            counter=0;
            senti__visible = 1;
            stored__msg="";
          });
          }
        //====================
        
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
      //other msg->fire end
    });//fetch url ka end
      msg__text.value="";
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });

  } else {
      console.log('vapas aloy index var login nahi barobar mhanun');
   window.location.replace("./index.html");
  }
});

//python madhun reply ithe pathavaycha n firebase la store karaych .....ha store hoi paryant wait for msg dakhavaych.....//.then madhe wait kadhun takaych
}
}

// chatting col-8 madhe varti disasathi te sagla data firestore madhun gheun display karat ahe
console.log("collection ",host__id);