var config = {
    apiKey: "AIzaSyAIMwMyFTE1FGXxVaRcUimcksL9ZjS0EFs",
    authDomain: "shining-fire-119.firebaseapp.com",
    databaseURL: "https://shining-fire-119.firebaseio.com",
    storageBucket: "shining-fire-119.appspot.com",
  };
firebase.initializeApp(config);

ImageDealer.REF = firebase;
var fbProvider = new firebase.auth.FacebookAuthProvider();
var users = firebase.database().ref("users");
var items = firebase.database().ref("items");
var currentUser = {
	displayName: "",
	uid: "",
	photoURL: ""
};
var viewModal = new ViewModal($('#view-modal'));
var uploadModal = new UploadModal($('#upload-modal'));
var currentItem;

/*
    分為三種使用情形：
    1. 初次登入，改變成登入狀態
    2. 已為登入狀態，reload 網站照樣顯示登入狀態
    3. 未登入狀態

    登入/當初狀態顯示可使用下方 logginOption function
*/


firebase.auth().onAuthStateChanged(function(user){

	if(user){

		currentUser.displayName = user.displayName;
	  	currentUser.uid = user.uid;
	  	currentUser.photoURL = user.photoURL;
	  	logginOption(true);

	}else{

		logginOption(false);

	}

})

$("#signin").click(function () {
  firebase.auth().signInWithPopup(fbProvider).then(function(result){

  	currentUser.displayName = result.user.displayName;
  	currentUser.uid = result.user.uid;
  	currentUser.photoURL = result.user.photoURL;

  	var link = "users/" + currentUser.uid;
  	var userData = firebase.database().ref(link);
  	console.log(link);
  	userData.set({
		displayName: currentUser.displayName,
		uid: currentUser.uid,
		photoURL: currentUser.photoURL
  	});

  	logginOption(true);

  }).catch(function(error){
  	var errorCode = error.code;
  	var errorMessa = error.message;
  	console.log(errorCode,errorMessa);
  });

});

$("#signout").click(function () {

    firebase.auth().signOut().then(function(){

    	currentUser.displayName = "";
  		currentUser.uid = "";
  		currentUser.photoURL = "";
    	logginOption(false);

    },function(error){

    	console.log(error.code);

    });

});

$("#submitData").click(function () {

    var dataArr = $("#item-info").serializeArray();
    var picFile = $("#picData")[0].files[0];

    if (dataArr[0].value != null && dataArr[1].value != null && dataArr[2].value != null && picFile ) {
    //check if it is picture(not yet)

    	var newItem = items.push();
    	var newID = newItem.key;
    	firebase.database().ref("items/" + newID).set({
    		title: dataArr[0].value, 
    		price: parseInt(dataArr[1].value), 
    		descrip: dataArr[2].value,
    		seller: currentUser.uid,
    		itemKey: newID
    	});

    	console.log(newID);
    	uploadModal.itemKey = newID;
    	uploadModal.submitPic(currentUser.uid);

	    $("#upload-modal").modal('hide');

    }
});

$('#editData').click(function(){

	var dataArr = $("#item-info").serializeArray();
  var picFile = $("#picData")[0].files[0];

  if (dataArr[0].value != null && dataArr[1].value != null && dataArr[2].value != null) {
  //check if it is picture(not yet)

  	firebase.database().ref("items/" + currentItem.itemKey).set({
  		title: dataArr[0].value,
  		price: parseInt(dataArr[1].value),
  		descrip: dataArr[2].value,
  		seller: currentItem.seller,
  		itemKey: currentItem.itemKey
  	});

  	uploadModal.itemKey = currentItem.itemKey;

  	if(picFile){
  		uploadModal.submitPic(currentUser.uid);
		}

  	items.once("value",reProduceAll);
    $("#upload-modal").modal('hide');

  }

});

$("#removeData").click(function () {

    firebase.database().ref("items/" + currentItem.itemKey).remove();
  	$("#upload-modal").modal('hide');

});

$(".dropdown-menu li:nth-of-type(1)").click(function (event) {
  viewAllItems();
});

$(".dropdown-menu li:nth-of-type(2)").click(function (event) {
  selectExpItems();
});

$(".dropdown-menu li:nth-of-type(3)").click(function (event) {
  selectCheapItems();
});

function viewAllItems() {

  items.once("value",reProduceAll);

}

function selectExpItems() {

  items.orderByChild("price").startAt(10000).on("value",reProduceAll);

}

function selectCheapItems() {

  items.orderByChild("price").endAt(9999).on("value",reProduceAll);

}

function logginOption(isLoggin) {
  if (isLoggin) {
    $("#upload").css("display","block");
    $("#signin").css("display","none");
    $("#signout").css("display","block");
  }else {
    $("#upload").css("display","none");
    $("#signin").css("display","block");
    $("#signout").css("display","none");
  }
}

items.on("value",reProduceAll);

function reProduceAll(allItems) {
    /*
    清空頁面上 (#item)內容上的東西。
    讀取爬回來的每一個商品
    */
  $("#items").empty();
  var allVal = allItems.val();

  /*
    利用for in存取
  */
  for (var sinItem in allVal) {

  	produceSingleItem(allVal[sinItem]);

  }
}
// 每點開一次就註冊一次
function produceSingleItem(sinItemData){
  /*
    抓取 sinItemData 節點上的資料。
    若你的sinItemData資料欄位中並沒有使用者名稱，請再到user節點存取使用者名稱
    資料齊全後塞進item中，創建 Item 物件，並顯示到頁面上。
  */


  var link = "users/" + sinItemData.seller;
  var userData = firebase.database().ref(link);
  var messBox = new MessageBox(currentUser.uid,sinItemData.itemKey);

  console.log(userData);

  userData.once("value", function(snapshot){
  	sinItemData.sellerName = snapshot.val().displayName;
  	console.log(sinItemData);
		items.once("value",function () {

	  	var cItem = new Item(sinItemData,currentUser);
	  	console.log(sinItemData);
	    $("#items").append(cItem.dom);

	    cItem.viewBtn.click(function(){
	    	$("#view-modal").modal('show');
	    	viewModal.callImage(sinItemData.itemKey,sinItemData.seller);
	    	viewModal.writeData(sinItemData);

	    	firebase.database().ref("messages/" + sinItemData.itemKey).orderByChild("time").on("value",function(snap){
	    		messBox.refresh();
	    		var allData = snap.val();
				  for (var msg in allData) {
				  	console.log(allData[msg]);
				    messBox.addDialog(allData[msg]);
				  }
	      })

				$("#message").append(messBox.dom);

			  if (currentUser.uid != "") {
			    $("#message").append(messBox.inputBox);

			    messBox.inputBox.keypress(function (e) {
			      if (e.which == 13) {
			        e.preventDefault();
			        var ref = firebase.database().ref("messages/" + sinItemData.itemKey);
							var msgData = {
								message: $(this).find("#dialog").val(),
								time: $.now(),
								name: currentUser.displayName,
								picURL: currentUser.photoURL
							};

							ref.push(msgData);
							messBox.refresh;

			        $(this).find("#dialog").val("");
			      }
			    });
			  }
	    });

	    cItem.editBtn.click(function(){
	    	$("#upload-modal").modal('show');
	    	uploadModal.callImage(sinItemData.itemKey,sinItemData.seller);
	    	uploadModal.editData(sinItemData);
	    	currentItem = sinItemData;
	    });



	    /*
	    從資料庫中抓出message資料，並將資料填入MessageBox
	    */
	      //firebase.database().ref().orderBy.("",function(data) {

	      //});
	    });

	    /*
	    如果使用者有登入，替 editBtn 監聽事件，當使用者點選編輯按鈕時，將資料顯示上 uploadModal。
	    */
    });
  
}

function generateDialog(diaData, messageBox) {


}
