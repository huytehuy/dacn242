import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import crypto from 'crypto'


MoMo.propTypes = {
    orderID: PropTypes.string,
    total: PropTypes.number,
    id_order: PropTypes.string,
}

MoMo.defaultProps = {
    orderID: '',
    total: 0,
    id_order: '',
}


function MoMo(props) {

    const [error, setError] = useState(false)

    const { orderID, total, id_order } = props


    useEffect(() => {
        const path = "https://test-payment.momo.vn/gw_payment/transactionProcessor"
        const partnerCode = "MOMOAE9T20220513"
        const accessKey = "aCM4gfrPKBmFwNBa"
        const serectkey = "S6rRbLSPkRXef39MVB0huuqNOPXVBW8c"
        const orderInfo = "Thanh toán MoMo"
        const notifyurl = "https://datnfixed.onrender.com/api/Payment/momo"
        const returnUrl = `https://shop.huytehuy.online/momo1/${id_order}`
        const amount = total.toString()
        const orderId = orderID
        const requestType = "captureMoMoWallet"
        const extraData = "merchantName=Payment"
        const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${orderId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&returnUrl=${returnUrl}&notifyUrl=${notifyurl}&extraData=${extraData}`

        var signature = crypto.createHmac('sha256', serectkey)
            .update(rawSignature)
            .digest('hex');

        var body = JSON.stringify({
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: orderId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            returnUrl: returnUrl,
            notifyUrl: notifyurl,
            extraData: extraData,
            requestType: requestType,
            signature: signature
        })

        axios.post(path, body)
            .then((response) => {
                if (response.data.errorCode !== 0) {
                    setError(true)
                    setTimeout(() => {
                        setError(false)
                    }, 1500)
                } else {

                    window.location.href = response.data.payUrl

                }
            })
            .catch(error => {
                console.error('There was an error!', error);
            })
    }, [orderID])

    return (
        <div>
            {/* {
                error &&
                <div className="modal_success">
                    <div className="group_model_success pt-3">
                        <div className="text-center p-2">
                            <i className="fa fa-bell fix_icon_bell" style={{ fontSize: '40px', color: '#fff', backgroundColor: '#f84545' }}></i>
                        </div>
                        <h4 className="text-center p-3" style={{ color: '#fff' }}>Lỗi thanh toán!!!</h4>
                    </div>
                </div>
            } */}
        </div>
    );
}

export default MoMo;