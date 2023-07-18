window.userWalletAddress = null
const loginButton = document.getElementById('loginButton')
const tryButton = document.getElementById('try')

var encryptionPublicKey = ""
var cryptojs_key = ""

local = false
localStorage.setItem("if_local", local);

// console.log(localStorage.getItem("ingang_address"));

var top_domain = ""

if (!local) {
    top_domain = "https://ingang.xyz"
}
else { top_domain = "https://10.0.0.14" }




function toggleButton() {
    if (!window.ethereum) {
        loginButton.innerText = 'MetaMask is not installed'
        loginButton.classList.add('cursor-not-allowed')
        loginButton.disabled = true
        loginButton.className = "no_metamask"
        // return false
    }
    loginButton.addEventListener('click', loginWithMetaMask)
    tryButton.addEventListener('click', visitwitouthlogin)
}


function visitwitouthlogin() {
    web_address = top_domain + "/ingang";
    window.location.replace(web_address);
}
async function loginWithMetaMask() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        .catch((e) => {
            console.error(e.message)
            return
        })
    if (!accounts) { return }

    window.userWalletAddress = accounts[0]
    loginButton.innerText = window.userWalletAddress
    localStorage.setItem("ingang_address", accounts[0]);

    //get_publickey_and_verify()
    try_to_login()
    loginButton.innerText = 'Sign out of MetaMask'

    loginButton.removeEventListener('click', loginWithMetaMask)
    setTimeout(() => {
        loginButton.addEventListener('click', signOutOfMetaMask)
    }, 200)
}

function signOutOfMetaMask() {
    window.userWalletAddress = null
    loginButton.innerText = 'Sign in with MetaMask'
    remove_all_content_element()
    loginButton.removeEventListener('click', signOutOfMetaMask)
    setTimeout(() => {
        loginButton.addEventListener('click', loginWithMetaMask)
    }, 200)
}

// send address and try to login
function try_to_login() {
    let json = { "address": window.userWalletAddress, "publickey": "check" };
    stringfy = JSON.stringify(json)
    url = top_domain + '/encrypt/' + encodeURIComponent(stringfy)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            try_to_login_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous

    xmlHttp.send(null);
}

// try to login callback
function try_to_login_callback(data) {
    console.log("response is " + data)
    if (data == "request_metamask_public_key") {
        console.log("no metamask public key stored, request from client side")
        get_publickey_and_verify()
    }
    else {
        decrypt(data)
    }
}

// get publickey from metamask and send to server
function get_publickey_and_verify() {
    ethereum
        .request({
            method: 'eth_getEncryptionPublicKey',
            params: [window.userWalletAddress], // you must have access to the specified account
        })
        .then((result) => {
            encryptionPublicKey = result;
            console.log("public key is " + encryptionPublicKey)
            send_publickey_and_recieve()
        })
        .catch((error) => {
            if (error.code === 4001) {
                // EIP-1193 userRejectedRequest error
                console.log("We can't encrypt anything without the key.");
                loginButton.innerText = 'Wallet not supported'
            } else {
                console.error(error);
                loginButton.innerText = 'Wallet not supported'
            }
        });
}

// send publickey of metamask to server and recieve encrypt head message
function send_publickey_and_recieve() {
    let json = { "address": window.userWalletAddress, "publickey": encryptionPublicKey };
    stringfy = JSON.stringify(json)
    url = top_domain + '/encrypt/' + encodeURIComponent(stringfy)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous

    xmlHttp.send(null);
}


function callback(data) {
    decrypt(data)
}

// decrypt message 
function decrypt(data) {
    encryptedMessage = data
    ethereum
        .request({
            method: 'eth_decrypt',
            params: [encryptedMessage, window.userWalletAddress],
        })
        .then((decryptedMessage) =>
            json_parse(decryptedMessage)
        )
        .catch((error) => console.log(error.message));
}

function json_parse(data) {
    obj = JSON.parse(data)
    console.log("header is ", obj.header)
    console.log("key is ", obj.key)
    cryptojs_key = obj.key
    localStorage.setItem("cryptojs_key", obj.key);
    web_address = top_domain + "/ingang"// + window.userWalletAddress
    window.location.replace(web_address);
}



window.addEventListener('DOMContentLoaded', () => {
    toggleButton()
});