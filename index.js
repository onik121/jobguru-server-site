require("dotenv").config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


// midleware
app.use(cors({
    origin: [
        'http://localhost:5173', 'https://jobguru.netlify.app', 'https://stellular-kelpie-58f967.netlify.app'
    ],
    credentials: true,
}));
app.use(express.json())
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jahid12.81vfswo.mongodb.net/?retryWrites=true&w=majority&appName=jahid12`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = (req, res, next) => {
    next();
}

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

const cookeOption = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production' ? true : false,   
}

async function run() {
    try {

        const jobsCollection = client.db("jobguru").collection("jobs")
        const bidsCollection = client.db("jobguru").collection("bids")

         // jwt related api
         app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, cookeOption ).send({ success: true });
        });

        app.post('/logout', async (req, res) => {
            res.clearCookie('token', { ...cookeOption, maxAge: 0 }).send({ success: true });
        });



        // get all job data
        app.get('/jobs', async (req, res) => {
            const filter = req.query.search;
            const budget = req.query.budget;
            const query = {};
            if (filter) {
                query.job_title = { $regex: filter, $options: 'i' };
            }
            if (budget) {
                const [minBudget, maxBudget] = budget.split(' ').map(Number);
                query.min_salary = { $gte: minBudget };
                query.max_salary = { $lte: maxBudget };
            }
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        });
        // get single job data
        app.get('/jobs/id/:id', async (req, res) => {
            const id = req.params.id;
            const result = await jobsCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        // get all jobs posted by a specific user
        app.get('/jobs/email', logger, verifyToken, async (req, res) => {
            const id = req.query.email;
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden acess' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = jobsCollection.find({ buyer_email: id });
            const result = await cursor.toArray();
            res.send(result);
        });

        // get all bids by a specific user
        app.get('/my-bids', logger, verifyToken, async (req, res) => {
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden acess' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bidsCollection.find(query).toArray();
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



        // delete job data
        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(query);
            res.send(result)
        })



        // Update
        app.patch('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const job = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateCoffe = {
                $set: {
                    job_title: job.title,
                    job_banner: job.banner,
                    max_salary: job.maxsalary,
                    min_salary: job.minsalary,
                    deadline: job.deadline,
                    description: job.description,
                },
            };
            const result = await jobsCollection.updateOne(filter, updateCoffe, options);
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