import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import queryString from 'query-string'

import orderAPI from '../Api/orderAPI';
import Pagination from '../Shared/Pagination'
import Search from '../Shared/Search'
import axios from 'axios';
import io from "socket.io-client";

const socket = io('https://datnfixed.onrender.com/', {
    transports: ['websocket'], jsonp: false
});
socket.connect();

function ConfirmReturnOder(props) {
    const [filter, setFilter] = useState({
        page: '1',
        limit: '4',
        status: '6',
        change: true
    })

    const [order, setOrder] = useState([])
    const [totalPage, setTotalPage] = useState()
    const [note, setNote] = useState([])

    useEffect(() => {
        const query = '?' + queryString.stringify(filter)

        const fetchAllData = async () => {
            const od = await orderAPI.getAPI(query)
            console.log(od)
            setTotalPage(od.totalPage)
            setOrder(od.orders)


        }

        fetchAllData()
    }, [filter])

    const onPageChange = (value) => {
        setFilter({
            ...filter,
            page: value
        })
    }

    //Hàm này dùng để nhận socket từ server gửi lên
    useEffect(() => {

        //Nhận dữ liệu từ server gửi lên thông qua socket với key receive_order
        socket.on('receive_order', (data) => {
            setNote(data)
        })

    }, [])

    const handleConfirm = async (value) => {
       
        const query = '?' + queryString.stringify({ id: value._id })
        const detail = await orderAPI.get_detail_order(value._id)
        console.log(detail)
        for (const detail_order of detail) {
                 await handleSubmittupdatekho(detail_order.id_product, detail_order.count);
             }
        const response = await orderAPI.completeReturnOrder(query)

        if (response.msg === "Thanh Cong") {
           
            // for (const detail of detail) {
            //     await handleSubmittupdatekho(detail.id_product, detail.count);
            // }
            
            
            
            setFilter({
                ...filter,
                change: !filter.change
            })
        }
    }
    const [productId, setProductId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmittupdatekho = async (id,count) => {
        //e.preventDefault();
        setLoading(true);
        setMessage(''); // Reset message before the request

        try {
            // Gửi request đến API cập nhật kho
            const response = await axios.patch('https://datnfixed.onrender.com/api/admin/product/updateDepository1', {
                _id: id,
                count: count 
            });
            console.log(response);

            setMessage(response.data.msg); // Set message to show success
        } catch (error) {
            setMessage(error.response?.data?.msg || 'Có lỗi xảy ra'); // Show error message if any
        } finally {
            setLoading(false);
        }
    };
    const handleCancel = async (value) => {
        const query = '?' + queryString.stringify({ id: value._id })

        const response = await orderAPI.cancelOrder(query)

        if (response.msg === "Thanh Cong") {
            setFilter({
                ...filter,
                change: !filter.change
            })
        }
    }

    return (
        <div className="page-wrapper">

            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <h4 className="card-title">Confirm Order</h4>
                                {
                                    note ? (<h5>{note}</h5>) : (<div></div>)
                                }
                                <div className="table-responsive mt-3">
                                    <table className="table table-striped table-bordered no-wrap">
                                        <thead>
                                            <tr>
                                                <th>Action</th>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Address</th>
                                                <th>Status</th>
                                                <th>Code</th>
                                                <th>Total Money</th>
                                                <th>Payment</th>

                                            </tr>
                                        </thead>

                                        <tbody>
                                            {
                                                order && order.map((value, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex">
                                                                <Link to={"/order/detail/" + value._id} className="btn btn-info mr-1">Detail</Link>

                                                                <button type="button" style={{ cursor: 'pointer', color: 'white' }} onClick={() => handleConfirm(value)} className="btn btn-success mr-1" >Xác nhận</button>
                                                                {
                                                                    !value.pay && <button type="button" style={{ cursor: 'pointer', color: 'white' }} onClick={() => handleCancel(value)} className="btn btn-danger" >Hủy bỏ</button>
                                                                }       
                                                            </div>
                                                        </td>
                                                        <td className="name">{value._id}</td>
                                                        <td className="name">{value.id_note.fullname}</td>
                                                        <td className="name">{value.id_user.email}</td>
                                                        <td className="name">{value.id_note.phone}</td>
                                                        <td className="name">{value.address}</td>
                                                        <td>
                                                            {(() => {
                                                                switch (value.status) {
                                                                    case "1": return "Đang xử lý";
                                                                    case "2": return "Đã xác nhận";
                                                                    case "3": return "Đang giao";
                                                                    case "4": return "Hoàn thành";
                                                                    case "5": return "Đơn bị hủy";
                                                                    case "6": return "Đang duyệt trả hàng";
                                                                    default: return "Đã trả hàng";
                                                                }
                                                            })()}
                                                        </td>
                                                        <th clasName="name">{value.id_coupon}</th>
                                                        <td className="name">{new Intl.NumberFormat('vi-VN',{style: 'decimal',decimal: 'VND'}).format(value.total)+ ' VNĐ'}</td>
                                                        <td className="name">{value.pay === true ? "Đã thanh toán" : "Chưa thanh toán"}</td>

                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                    <Pagination filter={filter} onPageChange={onPageChange} totalPage={totalPage} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmReturnOder;