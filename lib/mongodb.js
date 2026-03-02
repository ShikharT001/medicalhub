import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const options = {};
let client;
let clientPromise;

if (!process.env.MONGO_URL) {
    throw new Error('Please add your Mongo URL to .env');
}

if (process.env.NODE_ENV === 'developement') {
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();

    }
    clientPromise = global.mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;
export async function getDb() {
    const client = await clientPromise;
    return client.db('medicalhub');
}