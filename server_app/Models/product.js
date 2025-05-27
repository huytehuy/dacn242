var mongoose = require('mongoose');

var schema = new mongoose.Schema(
    {
        id_category: {
            type: String,
            ref: 'Category'
        },
        name_product: String,
        price_product: String,
        image: String,
        describe: String,
        gender: String,
        depository: Number,
        brand: String,
    }
);

var Products = mongoose.model('Products', schema, 'product');

module.exports = Products;