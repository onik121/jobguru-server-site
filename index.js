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

        const jobsCollection = client.db("jobguru").collection("jobs")
        const bidsCollection = client.db("jobguru").collection("bids")

        // get all job data
        app.get('/jobs', async (req, res) => {
            // console.log(req.query)
            const cursor = jobsCollection.find()
            const result = await cursor.toArray();
            res.send(result);
        })
        // get single job data
        app.get('/jobs/id/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const result = await jobsCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        // get all jobs posted by a specific user
        app.get('/jobs/email/:email', async (req, res) => {
            const id = req.params.email;
            const cursor = jobsCollection.find({ buyer_email: id });
            const result = await cursor.toArray();
            res.send(result);
        });




        // post bids data
        app.post('/bids', async (req, res) => {
            const id = req.body;
            const result = await bidsCollection.insertOne(id)
            res.send(result)
        })

        // post add data 
        app.post('/jobs', async (req, res) => {
            const id = req.body;
            const result = await jobsCollection.insertOne(id);
            res.send(result)
        })

        // app.get('/id', async (req, res) => {
        //     const id = req.query.title;
        //     console.log(id)
        //     const query = { job_category: id }
        //     const result = await jobsCollection.find(query).toArray();
        //     res.send(result);
        // })

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