import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from "dotenv";
import { Product } from '../types/product.type';
dotenv.config();

let singleton: any;

const MONGO_URI:string = `${process.env.MONGO_URI}`;
const MONGO_DATABASE:string = `${process.env.MONGO_DATABASE}`;
const COLLECTION_NAME:string = "store-products";

export async function connectDB():Promise<Db> {
    if(singleton) return singleton;

    const client:MongoClient = new MongoClient(MONGO_URI);
   
    try {
        await client.connect();
        singleton = client.db(MONGO_DATABASE);
        console.log("Connected!");
    } catch (error) {
        console.error(error);
        singleton = null;
    }
    return singleton;
}

export async function getProducts() {
    const db = await connectDB();

    const products =  db.collection(COLLECTION_NAME).find().toArray();

    return products;
}

export async function insertProduct(product:Product) {
    const db = await connectDB();
    const result = await db.collection(COLLECTION_NAME).insertOne(product);
    return result;
}

export async function updateProduct(id:string, product:Product) {
    const objectId = ObjectId.createFromHexString(id);
    const db = await connectDB();

    const result = await db.collection(COLLECTION_NAME).updateOne({_id:objectId}, {$set:product});

    return result;
}

export async function deleteProduct(id:string) {
    const objectId = ObjectId.createFromHexString(id);
    const db = await connectDB();

    const result = await db.collection(COLLECTION_NAME).deleteOne({_id:objectId});

    return result;
}