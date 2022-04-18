async function login() {
    window.location.href = "index.html"
}

if (document.getElementById("btn-login") != null) {
    document.getElementById("btn-login").onclick = login;
}