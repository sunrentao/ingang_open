const http = require("http");
const https = require("https")
const fs = require('fs');

var privateKey = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');
var credentials = { key: privateKey, cert: certificate };

const path = require("path")
const express = require("express")
const CryptoJS = require('crypto-js')
const app = express()
const bodyParser = require('body-parser');
const mysql = require("mysql");
const { nextTick } = require("process");
const { NULL } = require("mysql/lib/protocol/constants/types");
const web3 = require('web3');
app.use(express.static('public'));
app.use(bodyParser.text({ extended: true }));
//app.use(express.json());

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);


httpServer.listen(80);
httpsServer.listen(443);
// app.listen(80)

const local = false

const domain = "https://ingang.xyz"
// ------------  for main page http request
app.get("/ingang.svg", function (req, res) {
    res.sendFile(path.join(__dirname, '', './common_element/ingang.svg'))
})

// front page
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '', 'new_index.html'))
})

app.get("/front_page.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', 'front_page.js'))
})


// ingang page
app.get("/ingang", function (req, res) {
    res.sendFile(path.join(__dirname, '', './ingang_page/ingang_index.html'))
})

app.get("/ingang/ingang.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', './ingang_page/ingang.js'))
})

//my page
app.get("/my_page", function (req, res) {
    res.sendFile(path.join(__dirname, '', './my_page/my_page.html'))
})

app.get("/my_page/my_page.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', './my_page/my_page.js'))
})

//following page
app.get("/following", function (req, res) {
    res.sendFile(path.join(__dirname, '', './following/following.html'))
})

app.get("/following/following.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', './following/following.js'))
})

//user page
app.get("/user_page", async (req, res) => {
    let address = req.query.address
    let index = fs.readFileSync(path.join(__dirname, './user_page/user_page.html'), 'utf8');
    index = index.replace('asdfasdf', address); //MODIFY THE FILE AS A STRING HERE
    return res.send(index);
})

app.get("/user_page/user_page.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', './user_page/user_page.js'))
})

// message page
app.get("/message_page", async (req, res) => {
    let id = req.query.id
    let index = fs.readFileSync(path.join(__dirname, './message_page/message_page.html'), 'utf8');
    index = index.replace('fdsafdsa', id); //MODIFY THE FILE AS A STRING HERE
    return res.send(index);
})

app.get("/message_page/message_page.js", function (req, res) {
    res.sendFile(path.join(__dirname, '', './message_page/message_page.js'))
})
//--------------end for main page




//-------------for sql -------------

if (!local) {
    var con = mysql.createConnection({
        host: "database-2.cnjmoogignzr.eu-central-1.rds.amazonaws.com",
        user: "admin",
        password: "11111",
        database: "ingang"
    });
}

if (local) {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "111111",
        database: "ingang"
    });
}

// create user tables
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    // user table
    let query_create = "CREATE TABLE IF NOT EXISTS User ( \
        user_id int NOT NULL AUTO_INCREMENT primary key, \
        address varchar(42) NOT NULL, \
        publickey varchar(255), \
        crypt_key varchar(42), \
        message_num int, \
        following_num int, \
        follower_num int,\
        nickname varchar(42), \
        INDEX address_index (address)\
            )";
    con.query(query_create, function (err, result) {
        if (err) throw err;
        console.log("user table created");
    });

    //create message table
    query_create = "CREATE TABLE IF NOT EXISTS Messages ( \
        message_id int NOT NULL AUTO_INCREMENT primary key, \
        content longtext, \
        creater_id int NOT NULL, \
        creater_address varchar(42) NOT NULL, \
        creater_nickname varchar(42), \
        relation int, \
        likes_numbers int, \
        time bigint(255) NOT NULL,\
        block_address varchar(255), \
        INDEX idex (creater_id, time, likes_numbers)\
            )";
    con.query(query_create, function (err, result) {
        if (err) throw err;
        console.log("message table created");
    });

    // create relation table
    query_create = "CREATE TABLE IF NOT EXISTS relations ( \
        id int NOT NULL AUTO_INCREMENT primary key, \
        user_id int  NOT NULL, \
        following_user_id int NOT NULL, \
        following_user_address varchar(42) NOT NULL, \
        time bigint(255) NOT NULL,\
        given_nickname varchar(43) ,\
        INDEX idex (user_id, following_user_address)\
            )";
    con.query(query_create, function (err, result) {
        if (err) throw err;
        console.log("relation table created");
    });

    // create likes table
    query_create = "CREATE TABLE IF NOT EXISTS likes ( \
            id int NOT NULL AUTO_INCREMENT primary key, \
            user_id int  NOT NULL, \
            message_id int NOT NULL, \
            time bigint(255) NOT NULL,\
            INDEX idex (user_id, message_id)\
                )";
    con.query(query_create, function (err, result) {
        if (err) throw err;
        console.log("likes table created");
    });

    query_create = "CREATE TABLE IF NOT EXISTS header ( \
        id int NOT NULL AUTO_INCREMENT primary key, \
        href varchar(255)  NOT NULL, \
        short_descrption varchar(255) NOT NULL, \
        time bigint(255),\
        INDEX idex (href, short_descrption)\
            )";
    con.query(query_create, function (err, result) {
        if (err) throw err;
        console.log("header table created");
    });
});

// insert publick key of metamask
function insert_public_key_in_sql(address, public_key) {
    let query = "INSERT INTO User (address, publickey) VALUES('" + address + "', '" + public_key + "')"
    con.query(query, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
}


// check likes in tables
function check_like(user_id, message_id, callback) {
    let query = "SELECT id FROM likes Where user_id = ? and message_id = ? "
    con.query(query, [user_id, message_id], function (err, result) {
        if (err) throw err;
        console.log("likes table checked");
        return callback(result)
    });
}

// check all relation in tables
function check_all_relation(user_id, callback) {
    let query = "SELECT following_user_id, given_nickname FROM relations Where user_id = ? "
    con.query(query, user_id, function (err, result) {
        if (err) throw err;
        console.log("relation table checked");
        return callback(result)
    });
}

// check relation in tables
function check_single_relation(user_id, following_user_address, callback) {
    let query = "SELECT given_nickname, id FROM relations Where user_id = ? and following_user_address = ? "
    con.query(query, [user_id, following_user_address], function (err, result) {
        if (err) throw err;
        console.log("relation table checked");
        return callback(result)
    });
}

// insert relation
function insert_relations(user_id, following_user_address) {
    check_single_relation(user_id, following_user_address, function (result) {
        if (result[0] == null) {
            get_user_id(following_user_address, function (result_) {
                let insert_query = "INSERT INTO relations (user_id, following_user_id, following_user_address, time) VALUES(?, ?, ?, ?)"
                con.query(insert_query, [user_id, result_[0].user_id, following_user_address, Date.now()], function (err, insert_result) {
                    if (err) throw err;
                })
            })
        }
        else {
            console.log("check relation not null")
        }
    })
}

// remove relation in sql
function remove_relations(user_id, creater_address) {
    let query = "DELETE FROM relations WHERE user_id = ? AND  following_user_address = ?"
    con.query(query, [user_id, creater_address], function (err, result) {
        if (err) throw err;
    })
}

// insert like to sql
function insert_like(user_id, message_id) {
    let insert_query = "INSERT INTO likes (user_id, message_id, time) VALUES(?, ?, ?)"
    con.query(insert_query, [user_id, message_id, Date.now()], function (err, insert_result) {
        if (err) throw err;
    })
}

// remove likes in sql
function remove_likes(user_id, message_id) {
    let query = "DELETE FROM likes WHERE user_id = ? AND  message_id = ?"
    con.query(query, [user_id, message_id], function (err, result) {
        if (err) throw err;
    })
}

// return like to tables
function get_likes_in_with_user_id(user_id, callback) {
    let query = "SELECT message_id FROM likes Where user_id = '?' "
    con.query(query, user_id, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

//update customized key in sql
function update_my_key_in_sql(address, key) {
    let query = "UPDATE User SET crypt_key = ? WHERE address = ?"
    con.query(query, [key, address], function (err, result) {
        if (err) throw err;
        console.log("1 key updated");
    });
}

// get user publickey of metamask, return not existed if false
function get_user_publickey(address, callback) {
    let string_result = ""
    let query = "SELECT publickey FROM User Where address ='" + address + "'"
    con.query(query, function (err, result) {
        if (err)
            throw err;
        console.log(result);
        if (result[0] == null) {
            string_result = "not existed";
        }
        else {
            string_result = result[0].publickey;
        }
        console.log(string_result);
        return callback(string_result)
    });
}

// return user id from address
function get_user_id(address, callback) {
    let query = "SELECT user_id FROM User Where address = ? "
    con.query(query, address, function (err, result) {
        if (err)
            throw err;
        return callback(result)
    });
}

// return my key 
function get_my_key(address, callback) {
    let my_key = ""
    let user_id
    let query = "SELECT crypt_key, user_id FROM User Where address ='" + address + "'"
    con.query(query, function (err, result) {
        if (err)
            throw err;
        console.log(result);
        if (result[0] == null) {
            my_key = null;
        }
        else {
            my_key = result[0].crypt_key;
            user_id = result[0].user_id
        }
        return callback(my_key, user_id)
    });
}

// insert message
function insert_message(user_id, content, callback) {
    let query = "INSERT INTO Messages (content, creater_id, creater_address, time) VALUES(?, ?, ?, ?)"
    con.query(query, [content, user_id, address, Date.now()], function (err, result) {
        if (err) throw err;
        console.log("1 message inserted");
        console.log("timestamp is " + Date.now())
        return callback(true)
    });
}

// get message based on address
function get_user_owned_message(address, callback) {

    let query = "SELECT message_id, creater_address, content, time, block_address FROM Messages Where creater_address = ? "
    con.query(query, address, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

// get message based on following
function get_some_users_message(addresses, callback) {
    let ids = '';
    addresses.forEach(function (entry, index) {
        ids += (index == 0) ? entry : ',' + entry;
    });
    console.log(ids);
    let query = "SELECT message_id, creater_address, content, time, block_address FROM Messages Where creater_id IN (" + ids + ")"
    console.log(query, ids)
    con.query(query, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

// get random message
function get_randam_message(user_id, callback) {
    let query = "SELECT message_id, creater_address, content, time, block_address FROM Messages ORDER BY RAND() LIMIT 100 "
    con.query(query, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

// get random message
function get_message_on_id(message_id, callback) {
    let query = "SELECT message_id, creater_address, content, time, block_address FROM Messages Where message_id = ? "
    con.query(query, message_id, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

// get random message
function get_randam_message_without_login(callback) {
    let query = "SELECT message_id, creater_address, content, time, block_address FROM Messages ORDER BY RAND() LIMIT 100 "
    con.query(query, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

function get_header_sql(user_id, callback) {
    let query = "SELECT href, short_descrption FROM header ORDER BY RAND() LIMIT 1 "
    con.query(query, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

//------------finish sql functions



//---- for server side http request ----------------

app.get("/encrypt/:msg", function (req, res) {
    console.log("encrypt request")
    try {
        decode_msg = decodeURIComponent(req.params.msg)
        address = JSON.parse(decode_msg).address
        publickey = JSON.parse(decode_msg).publickey
        if (web3.utils.isAddress(address)
        ) {
            get_user_publickey(address, function (result) {
                if (publickey != "check") {
                    generate_encryptedmsg(publickey, function (encryptmsg_result, random_string) {
                        insert_public_key_in_sql(address, publickey)
                        update_my_key_in_sql(address, random_string)
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(encryptmsg_result)
                    }
                    )
                }
                if (publickey == "check" && result == "not existed") {
                    data = "request_metamask_public_key"
                    res.setHeader('Access-Control-Allow-Origin', domain);
                    res.send(data)
                }
                if (publickey == "check" && result != "not existed") {
                    generate_encryptedmsg(result, function (encryptmsg_result, random_string) {
                        update_my_key_in_sql(address, random_string)
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(encryptmsg_result)
                    }
                    )
                }
            })
        }
    } catch (error) {
        console.log("error in encrypt http request")
    }
})

app.get("/get_content/", function (req, res) {
    console.log("get random content")
    encrypt_msg = decodeURIComponent(req.query.msg)
    address = decodeURIComponent(req.query.address)
    workable = true
    if (web3.utils.isAddress(address)) {
        get_my_key(address, function (my_key, user_id) {
            if (my_key != null) {
                let bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key)
                let plaintext = ""
                console.log(plaintext)
                try {
                    plaintext = bytes.toString(CryptoJS.enc.Utf8)
                    local_header = JSON.parse(plaintext).header
                    local_txt = JSON.parse(plaintext).text
                } catch (error) {
                    workable = false
                }
                if (workable) {
                    local_header = JSON.parse(plaintext).header
                    if (local_header === my_key) {
                        generate_random_message(user_id, function (message_id, content, time, creater_address, likes, block_address) {
                            let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
                            //console.log ("json is " + json)
                            let stringfy = JSON.stringify(json)
                            let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                            let msg = encodeURIComponent(ciphertext)
                            try {
                                if (!local) {
                                    res.setHeader('Access-Control-Allow-Origin', domain);
                                }
                                res.send(msg);
                            } catch (e) {
                                console.log(e);
                                if (!local) {
                                    res.setHeader('Access-Control-Allow-Origin', domain);
                                }
                                res.send({ error: e.message });
                            }
                        })
                    }
                    else {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
                else {
                    if (!local) {
                        res.setHeader('Access-Control-Allow-Origin', domain);
                    }
                    res.send("the header is null")
                }
            }
        })
    }
})


app.get("/get_content_without_login/", function (req, res) {
    console.log("get random content")
    generate_random_message_without_login(function (message_id, content, time, creater_address, likes, block_address) {
        let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
        // let msg = encodeURIComponent(json)
        try {
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send(json);
        } catch (e) {
            console.log(e);
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send({ error: e.message });
        }
    })

})

// get someone's content without login
app.get("/get_user_owned_content_without_login/", function (req, res) {
    console.log("get user owned content")
    address_creater = decodeURIComponent(req.query.address2)
    generate_user_owned_message_without_login(address_creater, function (message_id, content, time, creater_address, likes, block_address) {
        let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
        //console.log ("json is " + json)
        // let msg = encodeURIComponent(json)
        try {
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send(json);
        } catch (e) {
            console.log(e);
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send({ error: e.message });
        }
    })
})



// get someone's content
app.get("/get_user_owned_content/", function (req, res) {
    console.log("get user owned content")
    address_requester = decodeURIComponent(req.query.address1)
    address_creater = decodeURIComponent(req.query.address2)
    if (web3.utils.isAddress(address_creater)) {
        get_my_key(address_requester, function (my_key, user_id) {
            if (my_key != null) {
                generate_user_owned_message(address_creater, user_id, function (message_id, content, time, creater_address, likes, block_address) {
                    let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
                    //console.log ("json is " + json)
                    let stringfy = JSON.stringify(json)
                    let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                    let msg = encodeURIComponent(ciphertext)
                    try {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(msg);
                    } catch (e) {
                        console.log(e);
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send({ error: e.message });
                    }
                })
            }
        })
    }
})

//get message on message id
app.get("/get_message_on_id/", function (req, res) {
    console.log("get message on id without login")
    address_requester = decodeURIComponent(req.query.address1)
    id = decodeURIComponent(req.query.id)
    if (web3.utils.isAddress(address_requester)) {
        get_my_key(address_requester, function (my_key, user_id) {
            if (my_key != null) {
                generate_message_on_id(user_id, id, function (message_id, content, time, creater_address, likes, block_address) {
                    let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
                    //console.log ("json is " + json)
                    let stringfy = JSON.stringify(json)
                    let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                    let msg = encodeURIComponent(ciphertext)
                    try {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(msg);
                    } catch (e) {
                        console.log(e);
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send({ error: e.message });
                    }
                })
            }
        })
    }
})

//get message on message id without login in
app.get("/get_message_on_id_without_login/", function (req, res) {
    console.log("get message on id without login")
    id = decodeURIComponent(req.query.id)
    generate_message_on_id_without_login(id, function (message_id, content, time, creater_address, likes, block_address) {
        let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
        //console.log ("json is " + json)
        // let msg = encodeURIComponent(json)
        try {
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send(json);
        } catch (e) {
            console.log(e);
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send({ error: e.message });
        }
    })
})



// get someone's content without login
app.get("/get_user_owned_content_without_login/", function (req, res) {
    console.log("get user owned content")
    address_creater = decodeURIComponent(req.query.id)
    generate_user_owned_message_without_login(address_creater, function (message_id, content, time, creater_address, likes, block_address) {
        let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
        //console.log ("json is " + json)
        // let msg = encodeURIComponent(json)
        try {
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send(json);
        } catch (e) {
            console.log(e);
            if (!local) {
                res.setHeader('Access-Control-Allow-Origin', domain);
            }
            res.send({ error: e.message });
        }
    })
})



// get following's content
app.get("/get_following_content/", function (req, res) {
    console.log("get following content")
    address_requester = decodeURIComponent(req.query.address1)
    if (web3.utils.isAddress(address_requester)) {
        get_my_key(address_requester, function (my_key, user_id) {
            if (my_key != null) {
                generate_following_message(user_id, function (message_id, content, time, creater_address, likes, block_address) {
                    let json = { "message_id": message_id, "content": content, "time": time, "creater_address": creater_address, "likes": likes, "block_address": block_address }
                    //console.log ("json is " + json)
                    let stringfy = JSON.stringify(json)
                    let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                    let msg = encodeURIComponent(ciphertext)
                    try {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(msg);
                    } catch (e) {
                        console.log(e);
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send({ error: e.message });
                    }
                })
            }
        })
    }
})

app.get("/get_single_user_relations/", function (req, res) {
    console.log("get single relation")
    address_requester = decodeURIComponent(req.query.address1)
    address_creater = decodeURIComponent(req.query.address2)
    if (web3.utils.isAddress(address_creater)) {
        get_my_key(address_requester, function (my_key, user_id) {
            if (my_key != null) {
                generate_single_relation(user_id, address_creater, function (id, nick_name) {
                    let json = { "given_nick_name": nick_name, "following_address": address_creater, "id": id }
                    //console.log ("json is " + json)
                    let stringfy = JSON.stringify(json)
                    let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                    let msg = encodeURIComponent(ciphertext)
                    try {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(msg);
                    } catch (e) {
                        console.log(e);
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send({ error: e.message });
                    }
                })
            }
        })
    }
})

app.get("/get_header/", function (req, res) {
    console.log("get header content")
    address_requester = decodeURIComponent(req.query.address1)
    if (web3.utils.isAddress(address_requester)) {
        get_my_key(address_requester, function (my_key, user_id) {
            if (my_key != null) {
                get_header_sql(user_id, function (result) {
                    if (result[0]) {
                        let json = { "href": result[0].href, "short_descrption": result[0].short_descrption }
                        //console.log ("json is " + json)
                        let stringfy = JSON.stringify(json)
                        let ciphertext = CryptoJS.AES.encrypt(stringfy, my_key);
                        let msg = encodeURIComponent(ciphertext)
                        try {
                            if (!local) {
                                res.setHeader('Access-Control-Allow-Origin', domain);
                            }
                            res.send(msg);
                        } catch (e) {
                            console.log(e);
                            if (!local) {
                                res.setHeader('Access-Control-Allow-Origin', domain);
                            }
                            res.send({ error: e.message });
                        }
                    }
                    else {
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send({ error: "not data" });
                    }
                })
            }
        })
    }
})


app.post("/save_content/", function (req, res) {
    console.log("save content request")
    try {
        encrypt_msg = req.body
        workable = true
        address = decodeURIComponent(req.query.address)
        if (web3.utils.isAddress(address)) {
            // encrypt_msg = decodeURIComponent(req.query.msg)
            address = decodeURIComponent(req.query.address)
            local_txt = " "
            local_header = " "
            get_my_key(address, function (my_key, user_id) {
                if (my_key != null) {
                    bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key);
                    plaintext = bytes.toString(CryptoJS.enc.Utf8);
                    try {
                        local_header = JSON.parse(plaintext).header
                        local_txt = JSON.parse(plaintext).text
                    } catch (error) {
                        workable = false
                    }
                    if (local_header === my_key && workable) {
                        insert_message(user_id, JSON.parse(local_txt).txt, function (result) {
                            if (!local) {
                                res.setHeader('Access-Control-Allow-Origin', domain);
                            }
                            res.send(result)
                        })
                    }
                    else {
                        console.log("save sql : header not match")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
            })
        }
    } catch (error) {
        console.log("error in save content http request")
    }

})

// add like
app.post("/add_like/", function (req, res) {
    console.log("add like request")
    try {
        encrypt_msg = req.body
        workable = true
        address = decodeURIComponent(req.query.address)
        if (web3.utils.isAddress(address)) {
            let message_id = -1
            local_header = " "
            get_my_key(address, function (my_key, user_id) {
                if (my_key != null) {
                    bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key);
                    plaintext = bytes.toString(CryptoJS.enc.Utf8);
                    try {
                        local_header = JSON.parse(plaintext).header
                        message_id = JSON.parse(plaintext).message_id
                    } catch (error) {
                        workable = false
                    }
                    if (local_header === my_key && workable) {
                        check_like(user_id, message_id, function (result) {
                            if (result[0] == null) {
                                console.log("record not exist, insert")
                                if (!local) {
                                    res.setHeader('Access-Control-Allow-Origin', domain);
                                }
                                res.send(true)
                                insert_like(user_id, message_id, function (result) {
                                })
                            }
                            else {
                                console.log(" reocrod exised")
                                if (!local) {
                                    res.setHeader('Access-Control-Allow-Origin', domain);
                                }
                                res.send(false)
                            }
                        })

                    }
                    else {
                        console.log("save sql : header not match")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
            })
        }
    } catch (error) {
        console.log("error in save content http request")
    }
})


// remove like
app.post("/remove_like/", function (req, res) {
    console.log("add like request")
    try {
        encrypt_msg = req.body
        workable = true
        address = decodeURIComponent(req.query.address)
        if (web3.utils.isAddress(address)) {
            let message_id = -1
            local_header = " "
            get_my_key(address, function (my_key, user_id) {
                if (my_key != null) {
                    bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key);
                    plaintext = bytes.toString(CryptoJS.enc.Utf8);
                    try {
                        local_header = JSON.parse(plaintext).header
                        message_id = JSON.parse(plaintext).message_id
                    } catch (error) {
                        workable = false
                    }
                    if (local_header === my_key && workable) {
                        remove_likes(user_id, message_id, function (result) {
                            console.log("remove like")
                            if (!local) {
                                res.setHeader('Access-Control-Allow-Origin', domain);
                            }
                            res.send(true)
                        })
                    }
                    else {
                        console.log("save sql : header not match")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
            })
        }
    } catch (error) {
        console.log("error in save content http request")
    }
})

// add following
app.post("/add_following/", function (req, res) {
    console.log("add like request")
    try {
        encrypt_msg = req.body
        workable = true
        address = decodeURIComponent(req.query.address)
        if (web3.utils.isAddress(address)) {
            local_header = " "
            get_my_key(address, function (my_key, user_id) {
                if (my_key != null) {
                    bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key);
                    plaintext = bytes.toString(CryptoJS.enc.Utf8);
                    try {
                        local_header = JSON.parse(plaintext).header
                        creater_address = JSON.parse(plaintext).creater_address
                    } catch (error) {
                        workable = false
                    }
                    if (local_header === my_key && workable) {
                        if (web3.utils.isAddress(creater_address)) {
                            insert_relations(user_id, creater_address, function (result) {
                            })
                            console.log("add following")
                            if (!local) {
                                res.setHeader('Access-Control-Allow-Origin', domain);
                            }
                            res.send(true)
                        }
                        else {
                            res.send("create address is illeagel")
                        }
                    }
                    else {
                        console.log("save sql : header not match")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
            })
        }
    } catch (error) {
        console.log("error in save content http request")
    }
})


// add following
app.post("/remove_following/", function (req, res) {
    console.log("add like request")
    try {
        encrypt_msg = req.body
        workable = true
        address = decodeURIComponent(req.query.address)
        if (web3.utils.isAddress(address)) {
            local_header = " "
            get_my_key(address, function (my_key, user_id) {
                if (my_key != null) {
                    bytes = CryptoJS.AES.decrypt(encrypt_msg, my_key);
                    plaintext = bytes.toString(CryptoJS.enc.Utf8);
                    try {
                        local_header = JSON.parse(plaintext).header
                        creater_address = JSON.parse(plaintext).creater_address
                    } catch (error) {
                        workable = false
                    }
                    if (local_header === my_key && workable) {
                        remove_relations(user_id, creater_address, function (result) {
                        })
                        console.log("remove following")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send(true)
                    }
                    else {
                        console.log("save sql : header not match")
                        if (!local) {
                            res.setHeader('Access-Control-Allow-Origin', domain);
                        }
                        res.send("header not match")
                    }
                }
            })
        }
    } catch (error) {
        concole.log("error in save content http request")
    }
})



// generate encryto message from metamask publickey
function generate_encryptedmsg(publicKey, callback) {
    const ethUtil = require('ethereumjs-util');
    const sigUtil = require('@metamask/eth-sig-util');

    header = random_string(24)

    let data = { "header": header, "key": header };
    const stringfy = JSON.stringify(data)
    try {
        const encryptedMessage = ethUtil.bufferToHex(
            Buffer.from(
                JSON.stringify(
                    sigUtil.encrypt({
                        publicKey: publicKey,
                        data: stringfy,
                        version: 'x25519-xsalsa20-poly1305',
                    })
                ),
                'utf8'
            )
        );
        return callback(encryptedMessage, header)
    }
    catch (e) {
        console.log("error when encrypt")
        return callback(" ")
    }
    //console.log(encryptedMessage)
}

function random_string(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_><';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    console.log("randam string is " + result);
    return result;
}



// -----------------generate content show on users page

function generate_random_message(user_id, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_randam_message(user_id, function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        get_likes_in_with_user_id(user_id, function (result1) {
            for (count in result1) {
                likes.push(result1[count].message_id)
            }
            return callback(message_id, message, time, creater_address, likes, block_address)
        })
    })
}


function generate_random_message_without_login(callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_randam_message_without_login(function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        return callback(message_id, message, time, creater_address, likes, block_address)
    })
}

function generate_user_owned_message_without_login(address, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_user_owned_message(address, function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        return callback(message_id, message, time, creater_address, likes, block_address)
    })
}

function generate_user_owned_message(address, user_id, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_user_owned_message(address, function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        get_likes_in_with_user_id(user_id, function (result1) {
            for (count in result1) {
                likes.push(result1[count].message_id)
            }
            return callback(message_id, message, time, creater_address, likes, block_address)
        })
    })
}

function generate_following_message(user_id, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    let following_user_id_s = []
    check_all_relation(user_id, function (result) {
        for (count in result) {
            following_user_id_s.push(result[count].following_user_id)
        }
        if (following_user_id_s.length > 0) {
            get_some_users_message(following_user_id_s, function (result1) {
                for (count in result1) {
                    message.push(result1[count].content)
                    time.push(result1[count].time)
                    creater_address.push(result1[count].creater_address)
                    message_id.push(result1[count].message_id)
                    block_address.push(result1[count].block_address)
                }

                get_likes_in_with_user_id(user_id, function (result2) {
                    for (count in result2) {
                        likes.push(result2[count].message_id)
                    }
                    return callback(message_id, message, time, creater_address, likes, block_address)
                })
            })
        }
        else {
            return callback(message_id, message, time, creater_address, likes, block_address)
        }

    })
}

function generate_single_relation(user_id, address_creater, callback) {
    let id = []
    let nick_name = []
    check_single_relation(user_id, address_creater, function (result) {
        for (count in result) {
            id.push(result[count].id)
            nick_name.push(result[count].given_nickname)
        }
        return callback(id, nick_name)
    })
}

function generate_message_on_id(user_id, id, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_message_on_id(id, function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        get_likes_in_with_user_id(user_id, function (result1) {
            for (count in result1) {
                likes.push(result1[count].message_id)
            }
            return callback(message_id, message, time, creater_address, likes, block_address)
        })
    })
}


function generate_message_on_id_without_login(id, callback) {
    let message = []
    let time = []
    let creater_address = []
    let message_id = []
    let likes = []
    let block_address = []
    get_message_on_id(id, function (result) {
        for (count in result) {
            message.push(result[count].content)
            time.push(result[count].time)
            creater_address.push(result[count].creater_address)
            message_id.push(result[count].message_id)
            block_address.push(result[count].block_address)
        }
        return callback(message_id, message, time, creater_address, likes, block_address)
    })
}