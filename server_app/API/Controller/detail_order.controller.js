const Detail_Order = require('../../Models/detail_order')

// Hiển thị chi tiết hóa đơn
// Phương thức GET
module.exports.detail = async (req, res) => {
    try {
        const id_order = req.params.id
        const detail_order = await Detail_Order.find({ id_order: id_order }).populate('id_product')

        // Ngăn 304 bằng cách vô hiệu hóa cache và đặt ETag/Last-Modified khác nhau mỗi lần
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
            'Last-Modified': new Date().toUTCString(),
            'ETag': `${Date.now()}-${Math.random().toString(36).slice(2)}`
        })

        return res.status(200).json(detail_order)
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' })
    }
}

// Phuong Thuc Post
module.exports.post_detail_order = async (req, res) => {
    try {
        const detail_order = await Detail_Order.create(req.body)

        // Vô hiệu hóa cache cho response POST
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
            'Last-Modified': new Date().toUTCString(),
            'ETag': `${Date.now()}-${Math.random().toString(36).slice(2)}`
        })

        return res.status(201).json(detail_order)
    } catch (err) {
        return res.status(400).json({ message: 'Bad request' })
    }
}