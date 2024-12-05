const path = require('path');
const multer = require('multer');
const {MongoClient} = require("mongodb");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({storage});

const mongoURI = process.env.MONGODB_URI;
let client;
let db;
MongoClient.connect(mongoURI)
    .then((connectedClient) => {
        client = connectedClient;
        db = client.db('TUD-LOST-FOUND');
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

// Add lost item
const addLostItem = async (req, res) => {
    const {name, category, description, location, dateLost, email} = req.body;
    const image = req.file;

    const imagePath = image ? path.join('images', image.filename) : null;

    const lostItem = {
        name,
        category,
        description,
        location,
        dateLost,
        email,
        image: imagePath,
        createdAt: new Date(),
    };

    try {
        const collection = db.collection('lost_items');
        const result = await collection.insertOne(lostItem);

        console.log('Data inserted successfully:', result);

        res.json({
            success: true,
            message: 'Data received successfully from backend!',
            receivedData: {
                name,
                category,
                description,
                location,
                dateLost,
                email,
            },
            image: image ? image.originalname : 'No image',
        });
    } catch (error) {
        console.error('Error inserting document into MongoDB:', error);
        res.status(500).json({
            success: false,
            message: 'Error inserting data into MongoDB',
        });
    }
};

const getLostItems = async (req, res) => {
    try {
        const collection = db.collection('lost_items');
        const items = await collection.find().toArray();

        const baseUrl = `${req.protocol}://${req.get('host')}`; // e.g., http://localhost:3000
        const itemsWithFullImagePath = items.map(item => ({
            ...item,
            image: `${baseUrl}/${item.image}` // Prepend base URL to image path
        }));

        console.log('Fetched lost items:', itemsWithFullImagePath);

        res.json({
            success: true,
            items: itemsWithFullImagePath
        });
    } catch (err) {
        console.error('Error fetching lost items:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching lost items'
        });
    }
};

module.exports = {
    addLostItem,
    upload,
    getLostItems
};
