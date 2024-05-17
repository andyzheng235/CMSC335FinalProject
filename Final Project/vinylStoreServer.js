// require path, dotenv, mongodb, express, and body-parser
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env')});
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const statusCode = 200;
const portNumber = 3000; // to run locally
process.stdin.setEncoding("utf8");

const uri = process.env.MONGO_CONNECTION_STRING;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

// ensure terminal command is only node vinylStoreServer.js
if (process.argv.length != 2) {
    process.stdout.write(`Usage ${process.argv[1]}`);
    process.exit(1);
}

// allow express to use templates and css
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(path.join(__dirname + '/templates')));
app.set("view engine", "ejs");

// fetch json
let albumList = require("./templates/albums.json");

// using templates
app.get("/", (request, response) => {
    response.render("home");
});

app.get("/catalog", (request, response) => {
    response.render("catalog");
});

let description;

app.get("/checkout", (request, response) => {
    const product = request.query.product;
    albumList.forEach(item => {
        if (item.id == product) {
            let trackList = "<ol>";
            item.tracklist.forEach(track => {
                trackList += `<li>${track}</li>`;
            });
            trackList += "</ol>";
            description = {
                album: item.albumName,
                artist: item.artist,
                image: `<img src="${item.image}" alt="${item.albumName}" class="albumCover"></img>`,
                release: item.releaseDate,
                number: item.numSongs,
                length: item.length,
                tracks: trackList
            };
        }
    });
    response.render("checkout", description);
});

// need for express post methods
app.use(bodyParser.urlencoded({extended:false}));

// initiate mongo client processor
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

app.post("/confirmation", async (request, response) => {
    let orderInfo = {
        image: description.image,
        album: description.album,
        artist: description.artist,
        name: request.body.name,
        email: request.body.email,
        address: request.body.address
    };

    try {
        await client.connect();
        await client.db(db).collection(collection).insertOne(orderInfo);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    response.render("confirmation", orderInfo);
});

app.listen(portNumber);

// console input and output
console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";

process.stdout.write(prompt);
process.stdin.on('readable', () => {  
	const dataInput = process.stdin.read();
	if (dataInput !== null) {
		const command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  
        } 
        else {
			console.log(`Invalid command: ${command}`);
		}
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});