const Arweave = require('arweave');
const mysql = require("mysql");
const { NULL } = require("mysql/lib/protocol/constants/types");

// Or to specify a gateway when running from NodeJS you might use
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});


var content_ = " asdfad"

const local = false

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


con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    // user table
});

function update_arweave_address(callback) {
    let query = "UPDATE Messages SET block_address = ? Where block_address IS NULL "
    con.query(query, "pending", function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

// get message based on address
function get_messages(callback) {
    let query = "SELECT creater_address, content, time FROM Messages Where block_address = 'pending' "
    con.query(query, function (err, result) {
        if (err) throw err;
        return callback(result)
    });
}

async function generate_messages(callback) {
    let content = []

    update_arweave_address(function (result) {
        get_messages(function (result) {
            for (count in result) {
                content.push("{" + result[count].content + "," + result[count].creater_address + "," +
                    result[count].time + "}")
            }
            // console.log(JSON.stringify(content))
            console.log(content_)
            content_ = JSON.stringify(content)
            console.log(content_)
        })
    })
    return new Promise((resolve, reject) => {
        let y = 0
        setTimeout(() => {
            console.log('Loop completed.')
            resolve(content)
        }, 10000)
    })

}

async function generate_messages_and_send() {

    let result_ = ""
    result_ = await generate_messages(result_)
    console.log("this is return " + result_)

    // update_arweave_address()
    let transaction = await arweave.createTransaction({ data: JSON.stringify(result_) }, key);
    transaction.addTag('Content-Type', 'application/json');
    await arweave.transactions.sign(transaction, key);
    let uploader = await arweave.transactions.getUploader(transaction);
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
}

generate_messages_and_send()

// let transaction = await arweave.createTransaction({ data: upload_content }, key);
// transaction.addTag('Content-Type', 'text/plain');

// await arweave.transactions.sign(transaction, key);

// let uploader = await arweave.transactions.getUploader(transaction);

// while (!uploader.isComplete) {
//   await uploader.uploadChunk();
//   console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
// }

