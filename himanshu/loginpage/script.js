document.addEventListener("DOMContentLoaded", function(){

let form = document.getElementById("loginForm");

if(form){

form.addEventListener("submit", function(e){

e.preventDefault();

let username = document.getElementById("username").value;
let password = document.getElementById("password").value;

if(username === "admin" && password === "1234"){

alert("Login Successful");

window.location.href = "../dashboard/dashboard.html";

}
else{

document.getElementById("error").innerText =
"Invalid username or password";

}

});

}

});