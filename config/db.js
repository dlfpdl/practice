const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async() => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected');
    } catch(err) {
        console.error(err.message);
        // Figure out what process() does in JS
        process.exit(1);
    }
}

// module export the function defined, to make it available in another functions as well
module.exports = connectDB;