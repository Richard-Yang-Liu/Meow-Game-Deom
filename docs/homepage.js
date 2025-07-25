const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const loginPopup = document.getElementById("login-popup");
const registerPopup = document.getElementById("register-popup");
const authChoice = document.querySelector(".auth-choice");
const menuPanel = document.getElementById("menu-panel");
const loginForm = document.querySelector(".login-form");
const registerForm = document.getElementById("register-form");

// Remember Login
// window.addEventListener("load", () => {
//   const isLoggedIn = localStorage.getItem("loggedIn");

//   if (isLoggedIn === "true") {
//     authChoice.style.display = "none";
//     loginPopup.style.display = "none";
//     registerPopup.style.display = "none";
//     menuPanel.style.display = "flex";
//   }
// });


// Register and Longin
const gotoRegister = document.getElementById("goto-register");

if (gotoRegister) {
  gotoRegister.addEventListener("click", () => {
    loginPopup.style.display = "none";
    registerPopup.style.display = "block";
  });
}

loginButton.addEventListener("click", () => {
  authChoice.style.display = "none";
  loginPopup.style.display = "block";
});

registerButton.addEventListener("click", () => {
  authChoice.style.display = "none";
  registerPopup.style.display = "block";
});

// Login
// loginForm.addEventListener("submit", (e) => {
//   e.preventDefault();
//   loginPopup.style.display = "none";
//   menuPanel.style.display = "flex";
// });

// Demo Test
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
  localStorage.setItem("loggedIn", "true");
    loginPopup.style.display = "block";
      window.location.href = "homepage.html";
  });

// Back to homepage
const registerBack = document.getElementById("register-back");

registerBack.addEventListener("click", () => {
  registerPopup.style.display = "none";
  authChoice.style.display = "flex";
});

// Submit
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  // Succeed Login
  alert("Registration successful! You may now log in.");
  registerPopup.style.display = "none";
  authChoice.style.display = "flex";
});
