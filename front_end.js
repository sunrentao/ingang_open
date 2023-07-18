window.userWalletAddress = null
const loginButton = document.getElementById('loginButton')
const userWallet = document.getElementById('user_address')
const inputtxt = document.getElementById('inputtxt')
const typeButton = document.getElementById('inputbutton')
const ingangbutton = document.getElementById('ingangbutton')
const followingbutton = document.getElementById('followingbutton')
const mypagebutton = document.getElementById('mypagebutton')

var encryptionPublicKey = ""
var cryptojs_key = ""

local = true

// console.log(localStorage.getItem("ingang_address"));

var top_domain = ""

if (!local) {
    top_domain = "https://ingang.xyz"
}
else { top_domain = "https://localhost" }


// addElement(12321, "msg", 0, "this is address")

function toggleButton() {
    if (!window.ethereum) {
        userWallet.innerText = 'MetaMask is not installed'
        loginButton.classList.add('cursor-not-allowed')
        return false
    }

    typeButton.classList.add('cursor-not-allowed')
    typeButton.disabled = true
    followingbutton.classList.add('cursor-not-allowed')
    followingbutton.disabled = true
    mypagebutton.classList.add('cursor-not-allowed')
    mypagebutton.disabled = true

    loginButton.addEventListener('click', loginWithMetaMask)
    typeButton.addEventListener('click', typeintxt)
    mypagebutton.addEventListener('click', mypageclick)
    ingangbutton.addEventListener('click', ingangclick)
    followingbutton.addEventListener('click', followingclick)
}

function mypageclick() {
    remove_all_content_element()
    send_encrypt_msg_and_show_user_content(window.userWalletAddress, window.userWalletAddress)
}

function ingangclick() {
    remove_all_content_element()
    encrypt_send(cryptojs_key, cryptojs_key, cryptojs_key, 1)
}

function followingclick() {
    remove_all_content_element()
    get_following_and_show_content(window.userWalletAddress)
}

async function loginWithMetaMask() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        .catch((e) => {
            console.error(e.message)
            return
        })
    if (!accounts) { return }

    window.userWalletAddress = accounts[0]
    userWallet.innerText = window.userWalletAddress
    localStorage.setItem("ingang_address", accounts[0]);

    typeButton.disabled = false
    followingbutton.disabled = false
    mypagebutton.disabled = false

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
    userWallet.innerText = ''
    loginButton.innerText = 'Sign in with MetaMask'
    remove_all_content_element()
    loginButton.removeEventListener('click', signOutOfMetaMask)
    setTimeout(() => {
        loginButton.addEventListener('click', loginWithMetaMask)
    }, 200)
}

function remove_all_content_element() {
    const elements = document.querySelectorAll('.content');
    elements.forEach(box => {
        box.remove();
    });
    const elements_page = document.querySelectorAll('.personal_page');
    elements_page.forEach(box => {
        box.remove();
    });
}

async function typeintxt() {
    let d = new Date()
    time = d.getUTCHours() + ":" + d.getUTCMinutes() + "," + d.getUTCDate()
        + "/" + d.getUTCMonth() + "/" + d.getUTCFullYear()

    content = inputtxt.value + " : " + time
    json_msg = { "txt": inputtxt.value, "time": time }
    stringmsg = JSON.stringify(json_msg)
    encrypt_send(cryptojs_key, cryptojs_key, stringmsg, 2)
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
            } else {
                console.error(error);
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
    encrypt_send(obj.header, obj.key, obj.header, 1)
    send_encrypt_msg_and_show_header(window.userWalletAddress)
}

// send customized encrypt message
function encrypt_send(header, key, txt, send_type) {
    let json = { "header": header, "text": txt };
    stringfy = JSON.stringify(json)
    let ciphertext = CryptoJS.AES.encrypt(stringfy, key);
    console.log("encrypt msg is " + ciphertext)

    // get random content
    if (send_type == 1) {
        send_encrypt_msg_and_show_content(ciphertext)
    }

    // save content
    if (send_type == 2) {
        send_encrypt_msg_and_save_sql(ciphertext)
    }

    // send like
}

// send request message to get content
function send_encrypt_msg_and_show_content(msg) {
    url = top_domain + '/get_content' + "/?address=" + window.userWalletAddress + "&msg=" + encodeURIComponent(msg)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_content_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// send request message to get content
function get_following_and_show_content(msg) {
    url = top_domain + '/get_following_content' + "/?address1=" + window.userWalletAddress
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_content_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// send message to server and store
function send_encrypt_msg_and_save_sql(msg) {
    url = top_domain + '/save_content' + "/?address=" + window.userWalletAddress // + "&msg=" + encodeURIComponent(msg)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            save_msg_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(msg);
}

function save_msg_callback(msg) {
    console.log("save content is " + msg)
    typeButton.innerText = "content saving is " + msg
}

// send request message to get content
function send_encrypt_msg_and_show_user_content(address_requester, address_creater) {
    url = top_domain + '/get_user_owned_content' + "/?address1=" + encodeURIComponent(address_requester) + "&address2=" + encodeURIComponent(address_creater)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_content_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// send request message to get header
function send_encrypt_msg_and_show_header(address_requester) {
    url = top_domain + '/get_header' + "/?address1=" + encodeURIComponent(address_requester)
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_header_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// get header content
function get_header_callback(data) {
    msg = decodeURIComponent(data)
    let bytes = CryptoJS.AES.decrypt(msg, cryptojs_key)
    let plaintext = bytes.toString(CryptoJS.enc.Utf8)
    try {
        let href = JSON.parse(plaintext).href
        let short_descrption = JSON.parse(plaintext).short_descrption
        let header = document.getElementById('header')
        header.href = href
        header.innerText = short_descrption
    } catch (e) { console.log(e) }
}


// add new element to content
function addcontentElement(message_id, msg, msg_time, creater_address, likes) {
    linebreak = document.createElement("br");

    let div = document.createElement("div")
    div.className = "content"
    let p = document.createElement("p")

    address_button = document.createElement("button")
    address_button.innerText = creater_address
    p.appendChild(address_button)
    p.appendChild(linebreak)
    address_button.addEventListener("click", function () {
        remove_all_content_element()
        if (window.userWalletAddress != creater_address) {
            send_encrypt_msg_and_show_get_single_relation(window.userWalletAddress, creater_address)
        } else {
            send_encrypt_msg_and_show_user_content(window.userWalletAddress, creater_address)
        }
    });

    let time = document.createElement("time")
    let time_txt = document.createTextNode(new Date(msg_time).toLocaleString() + "\n")
    time.appendChild(time_txt)
    p.appendChild(time)
    p.appendChild(linebreak)

    let text = document.createTextNode(msg)
    p.appendChild(text)

    like_button = document.createElement("button")
    like_button.innerText = "Like"
    like_button.className = "likes_button"
    like_button.id = message_id
    p.appendChild(like_button)
    like_button.addEventListener("click", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(message_id).innerText == "Like") {
            document.getElementById(message_id).innerText = "Liked"
            document.getElementById(message_id).style.color = "rgb(33, 23, 79)"
            send_add_like(message_id)
        }
        else {
            document.getElementById(message_id).innerText = "Like"
            document.getElementById(message_id).style.color = "rgb(59, 108, 136)"
            send_remove_like(message_id)
        }
    });
    for (count in likes) {
        if (message_id == likes[count]) {
            like_button.innerText = "Liked"
            like_button.style.color = "rgb(33, 23, 79)"
        }
    }

    div.appendChild(p)
    let main = document.getElementById("main");
    main.appendChild(div);
}

// get content callback
function get_content_callback(data) {
    msg = decodeURIComponent(data)
    let bytes = CryptoJS.AES.decrypt(msg, cryptojs_key)
    let plaintext = bytes.toString(CryptoJS.enc.Utf8)
    content = JSON.parse(plaintext).content
    time = JSON.parse(plaintext).time
    creater_address = JSON.parse(plaintext).creater_address
    message_id = JSON.parse(plaintext).message_id
    likes = JSON.parse(plaintext).likes
    if (content[0] == null) {
        addcontentElement("0", "you are new here", 0, window.userWalletAddress)
    }
    else {
        for (element in content) {
            addcontentElement(message_id[element], content[element], time[element], creater_address[element], likes)
        }
        // downloaded_txt.innerText = content1 + "   " + new Date(JSON.parse(plaintext).time[0]).toLocaleString()
    }
}

// send add likes to server
function send_add_like(message_id) {
    let json = { "header": cryptojs_key, "message_id": message_id };
    stringfy = JSON.stringify(json)
    let ciphertext = CryptoJS.AES.encrypt(stringfy, cryptojs_key);
    url = top_domain + '/add_like' + "/?address=" + encodeURIComponent(window.userWalletAddress)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            add_like_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(ciphertext);
}

// send remove likes to server
function send_remove_like(message_id) {
    let json = { "header": cryptojs_key, "message_id": message_id };
    stringfy = JSON.stringify(json)
    let ciphertext = CryptoJS.AES.encrypt(stringfy, cryptojs_key);
    url = top_domain + '/remove_like' + "/?address=" + encodeURIComponent(window.userWalletAddress)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            add_like_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(ciphertext);
}

function add_like_callback(data) {
    console.log(data)
}


// send request message to get single user relations
function send_encrypt_msg_and_show_get_single_relation(address_requester, address_creater) {
    url = top_domain + '/get_single_user_relations' + "/?address1=" + encodeURIComponent(address_requester) + "&address2=" + encodeURIComponent(address_creater)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_single_user_relations_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

// get content callback
function get_single_user_relations_callback(data) {
    msg = decodeURIComponent(data)
    let bytes = CryptoJS.AES.decrypt(msg, cryptojs_key)
    let plaintext = bytes.toString(CryptoJS.enc.Utf8)
    nick_name = JSON.parse(plaintext).given_nick_name[0]
    creater_address = JSON.parse(plaintext).following_address
    relation_id = JSON.parse(plaintext).id
    console.log(nick_name)
    if (nick_name == null) {
        nick_name = "no remark"
    }
    if (relation_id[0] == null) {
        addpersonalElement(creater_address, nick_name, false)
    }
    else {
        addpersonalElement(creater_address, nick_name, true)
        // downloaded_txt.innerText = content1 + "   " + new Date(JSON.parse(plaintext).time[0]).toLocaleString()
    }
    send_encrypt_msg_and_show_user_content(window.userWalletAddress, creater_address)
}


// addpersonalElement("1asdfsda", "this is nickname", 1)
// add personal page element
function addpersonalElement(creater_address, nick_name, following) {
    linebreak = document.createElement("br");

    let div = document.createElement("div")
    div.className = "personal_page"
    let address = document.createElement("address")
    address.innerText = creater_address;
    div.appendChild(address)

    let nick_name_element = document.createElement("h1")
    nick_name_element.innerText = nick_name;
    div.appendChild(nick_name_element)

    let etherscan = document.createElement("a")
    etherscan.innerText = "Etherscan";
    etherscan_next = "https://etherscan.io/address/" + creater_address
    etherscan.href = etherscan_next
    div.appendChild(etherscan)

    let following_button = document.createElement("button")
    if (!following) {
        following_button.innerText = "follow"
        following_button.style.color = "darkgray"
    }
    else {
        following_button.innerText = "following"
        following_button.style.color = "rgb(33, 23, 79)"
    }
    id = creater_address + "follow"
    following_button.id = id
    div.appendChild(following_button)
    following_button.addEventListener("click", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(id).innerText == "follow") {
            document.getElementById(id).innerText = "following"
            document.getElementById(id).style.color = "rgb(33, 23, 79)"
            send_add_following(creater_address)
        }
        else {
            document.getElementById(id).innerText = "follow"
            document.getElementById(id).style.color = "darkgray"
            send_remove_following(creater_address)
        }
    });
    // for (count in likes) {
    //     if (message_id == likes[count]) {
    //         like_button.innerText = "Liked"
    //         like_button.style.color = "rgb(33, 23, 79)"
    //     }
    // }
    let main = document.getElementById("main");
    main.appendChild(div);
}

// send add likes to server
function send_add_following(creater_address) {
    let json = { "header": cryptojs_key, "creater_address": creater_address };
    stringfy = JSON.stringify(json)
    let ciphertext = CryptoJS.AES.encrypt(stringfy, cryptojs_key);
    url = top_domain + '/add_following' + "/?address=" + encodeURIComponent(window.userWalletAddress)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            add_like_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(ciphertext);
}

// send add likes to server
function send_remove_following(creater_address) {
    let json = { "header": cryptojs_key, "creater_address": creater_address };
    stringfy = JSON.stringify(json)
    let ciphertext = CryptoJS.AES.encrypt(stringfy, cryptojs_key);
    url = top_domain + '/remove_following' + "/?address=" + encodeURIComponent(window.userWalletAddress)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            add_like_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(ciphertext);
}


window.addEventListener('DOMContentLoaded', () => {
    toggleButton()
});