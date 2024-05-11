const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


// midleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jahid12.81vfswo.mongodb.net/?retryWrites=true&w=majority&appName=jahid12`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const tourSpotsCollection = client.db("tourismDB").collection("touristsSpot")
        const countriesCollection = client.db("tourismDB").collection("countries")

        // read all data
        app.get('/tourspot', async (req, res) => {
            const cursor = tourSpotsCollection.find()
            const result = await cursor.toArray();
            res.send(result);
        }),
        app.get('/countries', async (req, res) => {
            const cursor = countriesCollection.find()
            const result = await cursor.toArray();
            res.send(result);
        }),



        // Read single data by ID
        app.get('/tourspot/id/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await tourSpotsCollection.findOne(query);
            res.send(result);
        });
        // Read single data by email
        app.get('/tourspot/email/:email', async (req, res) => {
            const email = req.params.email;
            const cursor = tourSpotsCollection.find({ email: email });
            const result = await cursor.toArray();
            res.send(result);
        });
        // 
        app.get('/countries/id/:id', async (req, res) => {
            const id = req.params.id;
            const query = { countryName: id};
            const result = await countriesCollection.findOne(query);
            res.send(result);
        });
        // 
        app.get('/tourspot/country/:name', async (req, res) => {
            const countryName = req.params.name;
            const cursor = tourSpotsCollection.find({ countryName: countryName });
            const result = await cursor.toArray();
            res.send(result);
        });




        // add data
        app.post('/tourspot', async (req, res) => {
            const newtourspot = req.body;
            console.log(newtourspot);
            const result = await tourSpotsCollection.insertOne(newtourspot);
            res.send(result)
        })




        // Update
        app.patch('/tourspot/id/:id', async (req, res) => {
            const id = req.params.id;
            const tourspot = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateCoffe = {
                $set: {
                    image: tourspot.image,
                    tourists_spot_name: tourspot.tourists_spot_name,
                    location: tourspot.location,
                    title: tourspot.title,
                    average_cost: tourspot. average_cost,
                    seasonality: tourspot.seasonality,
                    totalVisitorsPerYear: tourspot.totalVisitorsPerYear,
                    description: tourspot.description,
                    travel_time: tourspot.travel_time,
                    countryName: tourspot.countryName,
                },
            };
            const result = await tourSpotsCollection.updateOne(filter, updateCoffe, options);
            res.send(result)
        })



        // delete
        app.delete('/tourspot/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await tourSpotsCollection.deleteOne(query);
            res.send(result)
        })
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello world')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})