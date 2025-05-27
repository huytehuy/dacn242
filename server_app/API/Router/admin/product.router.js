var express = require('express')

var router = express.Router()

const Products = require('../../Controller/admin/product.controller')

router.get('/', Products.index)
router.get('/:id', Products.details)

router.post('/create', Products.create)

router.patch('/update', Products.update)

router.delete('/delete', Products.delete)
router.patch('/updateDepository', Products.updateDepository)
router.patch('/updateDepository1', Products.updateDepository1)


module.exports = router