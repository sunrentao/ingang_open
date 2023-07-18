const mysql = require("mysql");
const { NULL } = require("mysql/lib/protocol/constants/types");


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

function update_arweave_address() {
    let query = "UPDATE Messages SET block_address = ? Where block_address = 'pending' "
    con.query(query, arweave_address, function (err, result) {
        if (err) throw err;
        // return callback(result)
    });
}


update_arweave_address()
