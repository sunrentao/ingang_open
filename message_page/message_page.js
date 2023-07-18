const loginButton = document.getElementById('loginButton')
const ingangButton = document.getElementById('ingangButton')
const followingButton = document.getElementById('followingButton')
const mypageButton = document.getElementById('mypageButton')
const following_button = document.getElementById('following_button')
const etherscan = document.getElementById("etherscan")

var encryptionPublicKey = ""
var cryptojs_key = localStorage.getItem("cryptojs_key")
window.userWalletAddress = localStorage.getItem("ingang_address")
var id = document.getElementById("message_id").innerHTML
var address_creater = " "
// if (address_creater == null) {
//     web_address = top_domain + "/ingang"
//     window.location.replace(web_address);
// }

// if (address_creater == window.userWalletAddress) {
//     document.getElementById("following_button").remove()
// }

local = false
// local = localStorage.getItem("if_local")

console.log("local storage key is " + cryptojs_key);
console.log("local storage address is " + window.userWalletAddress);
console.log("this is log");

var top_domain = ""

if (!local) {
    top_domain = "https://ingang.xyz"
}
else { top_domain = "https://10.0.0.14" }

// addElement(12321, "msg", 0, "this is address")

function toggleButton() {
    if (!window.ethereum) {
        loginButton.innerText = 'MetaMask is not installed'
        loginButton.classList.add('cursor-not-allowed')
        loginButton.disabled = true
        loginButton.className = "no_metamask"
        // return false
    }
    if (cryptojs_key === null) {
        loginButton.addEventListener('click', loginWithMetaMask)
        document.getElementById("login_address").innerHTML = " "

        followingButton.disable = true
        followingButton.classList.add('cursor-not-allowed')
        mypageButton.disable = true
        mypageButton.classList.add('cursor-not-allowed')

        show_message_on_id_without_login(id)
        ingangButton.addEventListener('click', ingangclick)
    }

    if (cryptojs_key !== null) {
        // send_encrypt_msg_and_show_get_single_relation(window.userWalletAddress, address_creater)
        document.getElementById("login_address").innerHTML = window.userWalletAddress
        document.getElementById("user_address").innerHTML = address_creater

        loginButton.innerText = 'Log out'
        loginButton.addEventListener('click', signOutOfMetaMask)

        ingangButton.addEventListener('click', ingangclick)
        followingButton.addEventListener('click', followingclick)
        mypageButton.addEventListener('click', mypageclick)
        send_encrypt_msg_and_show_message_on_id(window.userWalletAddress, id)
    }

}

function ingangclick() {
    web_address = top_domain + "/ingang"// + window.userWalletAddress
    window.location.replace(web_address);
}

function followingclick() {
    web_address = top_domain + "/following"// + window.userWalletAddress
    window.location.replace(web_address);
}

function mypageclick() {
    web_address = top_domain + "/user_page?address=" + window.userWalletAddress// + window.userWalletAddress
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

    document.getElementById("login_address").innerHTML = window.userWalletAddress
    localStorage.setItem("ingang_address", accounts[0]);
    //get_publickey_and_verify()
    try_to_login()
    loginButton.innerText = 'Log out'

    loginButton.removeEventListener('click', loginWithMetaMask)
    setTimeout(() => {
        loginButton.addEventListener('click', signOutOfMetaMask)
    }, 200)
}

function signOutOfMetaMask() {
    window.userWalletAddress = null
    loginButton.innerText = 'Log in'
    localStorage.removeItem("cryptojs_key")
    localStorage.removeItem("ingang_address")
    document.getElementById("login_address").innerHTML = " "
    etherscan = document.getElementById("etherscan")
    etherscan_next = "https://etherscan.io/"
    etherscan.href = etherscan_next
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
    // send_encrypt_msg_and_show_user_content(window.userWalletAddress,window.userWalletAddress)s
}


// add new element to content
function addcontentElement(message_id, msg, msg_time, creater_address, likes, block_address) {
    linebreak = document.createElement("br");

    let div = document.createElement("div")
    div.className = "message"

    address_button = document.createElement("button")
    address_button.innerText = creater_address
    address_button.addEventListener("click", function () {
        //-----------send to address address
        web_address = top_domain + "/user_page?address=" + creater_address // + window.userWalletAddress
        window.location.replace(web_address);
        // if (window.userWalletAddress != creater_address) {
        //     // localStorage.setItem("visit_user_address", creater_address);
        //     web_address = top_domain + "/user_page?address=" + creater_address // + window.userWalletAddress
        //     window.location.replace(web_address);
        // } else {
        //     web_address = top_domain + "/my_page" // + window.userWalletAddress
        //     window.location.replace(web_address);
        // }
    });
    div.appendChild(address_button)
    let time = document.createElement("time")
    let time_txt = document.createTextNode(new Date(msg_time).toLocaleString() + "\n")
    time.appendChild(time_txt)
    div.appendChild(time)

    let p = document.createElement("p")
    let text = document.createTextNode(msg)
    p.appendChild(text)
    p.appendChild(linebreak)

    div.appendChild(p)

    let a = document.createElement("a")
    a.className = "arweave"
    let link = "https://viewblock.io/arweave/tx/"
    if (!block_address) {
        a.innerText = "arweave not ready"
        a.href = link
    }
    else if (block_address === "pending") {
        a.innerText = "arweave is pending"
        a.href = link
    }
    else {
        a.innerText = "arweave"
        link_address = link + block_address
        a.href = link_address
    }
    div.appendChild(a)
    like_button = document.createElement("i")
    like_button.className = "fa fa-fw fa-heart-o"
    like_button.id = message_id
    div.appendChild(like_button)
    like_button.addEventListener("click", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(message_id).classList.contains("fa-heart-o")) {
            document.getElementById(message_id).classList.remove("fa-heart-o");
            document.getElementById(message_id).classList.add("fa-heart");
            send_add_like(message_id)
        }
        else {
            document.getElementById(message_id).classList.remove("fa-heart");
            document.getElementById(message_id).classList.add("fa-heart-o");
            send_remove_like(message_id)
        }
    });
    for (count in likes) {
        if (message_id == likes[count]) {
            like_button.classList.remove("fa-heart-o");
            like_button.classList.add("fa-heart");
        }
    }

    let middle = document.getElementById("middle");
    middle.appendChild(div);
}

function remove_all_content_element() {
    const elements = document.querySelectorAll('.message');
    elements.forEach(box => {
        box.remove();
    });
}

// add new element to content
function addcontentElement_without_login(message_id, msg, msg_time, creater_address, block_address) {
    linebreak = document.createElement("br");

    let div = document.createElement("div")
    div.className = "message"

    address_button = document.createElement("button")
    address_button.innerText = creater_address
    address_button.addEventListener("click", function () {
        //-----------send to address address
        web_address = top_domain + "/user_page?address=" + creater_address // + window.userWalletAddress
        window.location.replace(web_address);
        // if (window.userWalletAddress != creater_address) {
        //     // localStorage.setItem("visit_user_address", creater_address);
        //     web_address = top_domain + "/user_page?address=" + creater_address // + window.userWalletAddress
        //     window.location.replace(web_address);
        // } else {
        //     web_address = top_domain + "/my_page" // + window.userWalletAddress
        //     window.location.replace(web_address);
        // }
    });
    div.appendChild(address_button)
    let time = document.createElement("time")
    let time_txt = document.createTextNode(new Date(msg_time).toLocaleString() + "\n")
    time.appendChild(time_txt)
    div.appendChild(time)

    let p = document.createElement("p")
    let text = document.createTextNode(msg)
    p.appendChild(text)
    p.appendChild(linebreak)

    div.appendChild(p)

    let a = document.createElement("a")
    a.className = "arweave"
    let link = "https://viewblock.io/arweave/tx/"
    if (!block_address) {
        a.innerText = "arweave not ready"
        a.href = link
    }
    else if (block_address === "pending") {
        a.innerText = "arweave is pending"
        a.href = link
    }
    else {
        a.innerText = "arweave"
        link_address = link + block_address
        a.href = link_address
    }
    div.appendChild(a)

    like_button = document.createElement("i")
    like_button.className = "fa fa-fw fa-heart-o"
    like_button.id = message_id
    div.appendChild(like_button)


    let middle = document.getElementById("middle");
    middle.appendChild(div);
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
            remove_like_callback(xmlHttp.responseText);
    }
    console.log("url is " + url)
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "text/plain");
    xmlHttp.send(ciphertext);
}

function add_like_callback(data) {
    if (data) {
        var x = document.getElementById("snackbar");
        // Add the "show" class to DIV
        // x.innerHTML = "liked"
        x.className = "show";
        // After 3 seconds, remove the show class from DIV
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    }
    console.log(data)
}


function remove_like_callback(data) {
    if (data) {
        var x = document.getElementById("snackbar");
        x.innerHTML = "remove like"
        // Add the "show" class to DIV
        x.className = "show";
        // After 3 seconds, remove the show class from DIV
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    }
    console.log(data)
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
    block_address = JSON.parse(plaintext).block_address
    remove_all_content_element()
    if (creater_address[0] == window.userWalletAddress) {
        console.log("this is my message")
        following_button.remove()
    }
    if (content[0] == null) {
        addcontentElement("0", "you are new here", 0, window.userWalletAddress)
    }
    else {
        for (element in content) {
            document.getElementById("user_address").innerHTML = creater_address[0]
            addcontentElement(message_id[element], content[element], time[element], creater_address[element], likes, block_address[element])
        }
        // downloaded_txt.innerText = content1 + "   " + new Date(JSON.parse(plaintext).time[0]).toLocaleString()
    }
    send_encrypt_msg_and_show_get_single_relation(window.userWalletAddress, creater_address[0])
}

// get content callback without login
function get_content_without_login_callback(data) {
    console.log("get_content_without_login call back log")
    console.log(data)
    let plaintext = data
    content = JSON.parse(plaintext).content
    time = JSON.parse(plaintext).time
    creater_address = JSON.parse(plaintext).creater_address
    message_id = JSON.parse(plaintext).message_id
    block_address = JSON.parse(plaintext).block_address
    remove_all_content_element()
    if (creater_address[0] == window.userWalletAddress) {
        document.getElementById("following_button").remove()
    }
    if (content[0] == null) {
        addcontentElement_without_login("0", "you are new here", 0, window.userWalletAddress)
    }
    else {
        document.getElementById("user_address").innerHTML = creater_address[0]
        etherscan_next = "https://etherscan.io/address/" + creater_address[0]
        etherscan.href = etherscan_next
        for (element in content) {
            addcontentElement_without_login(message_id[element], content[element], time[element], creater_address[element], block_address[element])
        }
        // downloaded_txt.innerText = content1 + "   " + new Date(JSON.parse(plaintext).time[0]).toLocaleString()
    }
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


// ---------------- following is different for different page

// send request message to get content
function send_encrypt_msg_and_show_message_on_id(address_requester, id) {
    url = top_domain + '/get_message_on_id' + "/?address1=" + encodeURIComponent(address_requester) + "&id=" + encodeURIComponent(id)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_content_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}


// send request message to get content without login
function show_message_on_id_without_login(id) {
    url = top_domain + '/get_message_on_id_without_login' + "/?id=" + encodeURIComponent(id)

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            get_content_without_login_callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}
// send message to server and store

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
    // send_encrypt_msg_and_show_user_content(window.userWalletAddress, creater_address)
}



// addpersonalElement("1asdfsda", "this is nickname", 1)
// add personal page element
function addpersonalElement(creater_address, nick_name, following) {

    etherscan.innerText = "Etherscan";
    etherscan_next = "https://etherscan.io/address/" + creater_address
    etherscan.href = etherscan_next
    if (!following) {
        following_button.innerText = "follow"
    }
    else {
        following_button.innerText = "following"
    }
    id = creater_address + "follow"
    following_button.id = id
    following_button.addEventListener("click", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(id).innerText == "follow") {
            document.getElementById(id).innerText = "following"
            send_add_following(creater_address)
        }
        else {
            document.getElementById(id).innerText = "follow"
            send_remove_following(creater_address)
        }
    });

    following_button.addEventListener("mouseover", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(id).innerText == "follow") {
        }
        else {
            document.getElementById(id).innerText = "unfollow"
        }

    });

    following_button.addEventListener("mouseout", function () {
        //alert("messag id is " + message_id + " , and creater id is " + creater_address);
        if (document.getElementById(id).innerText == "unfollow") {
            document.getElementById(id).innerText = "following"
        }

    });
    if (creater_address == window.userWalletAddress) {
        following_button.remove()
    }
    // for (count in likes) {
    //     if (message_id == likes[count]) {
    //         like_button.innerText = "Liked"
    //         like_button.style.color = "rgb(33, 23, 79)"
    //     }
    // }

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

function add_like_callback(data) {
    console.log(data)
}

window.addEventListener('DOMContentLoaded', () => {
    toggleButton()
});