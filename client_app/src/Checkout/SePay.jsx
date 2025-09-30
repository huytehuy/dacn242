import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { changeCount } from '../Redux/Action/ActionCount';
import { useDispatch, useSelector } from 'react-redux';
import OrderAPI from '../API/OrderAPI';
import NoteAPI from '../API/NoteAPI';
import Detail_OrderAPI from '../API/Detail_OrderAPI';
import CouponAPI from '../API/CouponAPI';
import { useTranslation } from 'react-i18next';
import Modal from 'react-bootstrap/Modal';

// SePay API configuration
const SEPAY_API_TOKEN = "UPGAYZVXHN6KLXQEOJKFKUAEDC2STY3SHWPWOHC4WJ2I0N9NB98HX7MT5JDI7GEZ";
const SEPAY_API_URL = "https://my.sepay.vn/api";

// Bank account details for QR payment
const BANK_ACCOUNT = "9699051";
const BANK_NAME = "ACB";

function SePay({ information, total, from, distance, duration, price }) {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [orderReference, setOrderReference] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const history = useHistory();
    const dispatch = useDispatch();
    const count_change = useSelector(state => state.Count.isLoad);
    const [orderData, setOrderData] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [paymentUrl, setPaymentUrl] = useState('');

    // Function to create a SePay transaction
    const createSePayTransaction = async () => {
        try {
            // Generate a unique reference ID for this transaction
            const referenceId = `ORDER-${Date.now()}`;
            
            // Create the payment request data
            const paymentData = {
                amount: total,
                currency: "VND",
                description: `Payment for order #${referenceId}`,
                redirect_url: `${window.location.origin}/success`,
                reference_id: referenceId,
                customer_name: information.fullname,
                customer_email: information.email,
                customer_phone: information.phone
            };
            
            // Make the API call to create transaction
            const response = await axios.post(
                `${SEPAY_API_URL}/transactions/create`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SEPAY_API_TOKEN}`
                    }
                }
            );
            
            // Check if the transaction was created successfully
            if (response.data && response.data.success) {
                setTransactionId(response.data.transaction.id);
                setPaymentUrl(response.data.transaction.payment_url);
                return response.data.transaction;
            } else {
                throw new Error(response.data.error || "Failed to create transaction");
            }
        } catch (error) {
            console.error("Error creating SePay transaction:", error);
            throw error;
        }
    };

    // Function to check transaction status
    const checkTransactionStatus = async (transId) => {
        try {
            const response = await axios.get(
                `${SEPAY_API_URL}/transactions/details/${transId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SEPAY_API_TOKEN}`
                    }
                }
            );
            
            if (response.data && response.data.success) {
                return response.data.transaction;
            } else {
                throw new Error(response.data.error || "Failed to check transaction status");
            }
        } catch (error) {
            console.error("Error checking SePay transaction status:", error);
            throw error;
        }
    };

    // Main function to handle payment
    const handleSePayPayment = async () => {
        setIsProcessing(true);
        setPaymentError('');

        try {
            // 1. Create SePay transaction
            const transaction = await createSePayTransaction();
            
            // 2. Process order data (same as before)
            if (localStorage.getItem("id_coupon")) {
                await CouponAPI.updateCoupon(localStorage.getItem("id_coupon"));
            }

            // 3. Create delivery note
            const data_delivery = {
                fullname: information.fullname,
                phone: information.phone,
            };
            const response_delivery = await NoteAPI.post_note(data_delivery);

            // 4. Create order with reference to SePay transaction
            const data_order = {
                id_user: sessionStorage.getItem('id_user'),
                address: information.address,
                total: total,
                status: "1", // Pending status
                pay: false, // Will be marked as paid after confirmation
                id_payment: '65a29a55c177c63bbf8109d3', // SePay payment ID
                id_note: response_delivery._id,
                feeship: price,
                id_coupon: localStorage.getItem('id_coupon') ? localStorage.getItem('id_coupon') : '',
                create_time: `${new Date().getDate()}/${parseInt(new Date().getMonth()) + 1}/${new Date().getFullYear()}`,
                transaction_id: transaction.id // Store SePay transaction ID
            };
            const response_order = await OrderAPI.post_order(data_order);

            // 5. Create order details for each product
            const data_carts = JSON.parse(localStorage.getItem('carts'));
            for (let i = 0; i < data_carts.length; i++) {
                const data_detail_order = {
                    id_order: response_order._id,
                    id_product: data_carts[i].id_product,
                    name_product: data_carts[i].name_product,
                    price_product: data_carts[i].price_product,
                    count: data_carts[i].count,
                    size: data_carts[i].size
                };
                await Detail_OrderAPI.post_detail_order(data_detail_order);
            }

            // 6. Store transaction and order info in localStorage for validation after return
            localStorage.setItem('sepay_transaction', JSON.stringify({
                transaction_id: transaction.id,
                order_id: response_order._id
            }));

            // 7. Redirect user to SePay payment URL
            window.location.href = transaction.payment_url;

        } catch (error) {
            console.error("SePay payment error:", error);
            setPaymentError(t('payment_failed') + ': ' + (error.message || "Unknown error"));
            setIsProcessing(false);
        }
    };

    // Function to handle QR code generation
    const handleQRCodePayment = async () => {
        try {
            setIsProcessing(true);
            
            // Generate a unique reference ID for this transaction
            const referenceId = `HUY${Date.now().toString().slice(-6)}`;
            setOrderReference(referenceId);
            
            // Create the description for the payment
            const paymentDescription = `Thanh toan ${referenceId}`;
            
            // Create QR code URL
            const qrUrl = `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_NAME}&amount=${total}&des=${encodeURIComponent(paymentDescription)}`;
            setQrCodeUrl(qrUrl);
            
            // 1. Process order data
            if (localStorage.getItem("id_coupon")) {
                await CouponAPI.updateCoupon(localStorage.getItem("id_coupon"));
            }

            // 2. Create delivery note
            const data_delivery = {
                fullname: information.fullname,
                phone: information.phone,
            };
            const response_delivery = await NoteAPI.post_note(data_delivery);

            // 3. Create order with reference to QR payment
            const data_order = {
                id_user: sessionStorage.getItem('id_user'),
                address: information.address,
                total: total,
                status: "1", // Pending status
                pay: false, // Will be marked as paid after confirmation
                id_payment: '65a29a55c177c63bbf8109d3', // SePay payment ID
                id_note: response_delivery._id,
                feeship: price,
                id_coupon: localStorage.getItem('id_coupon') ? localStorage.getItem('id_coupon') : '',
                create_time: `${new Date().getDate()}/${parseInt(new Date().getMonth()) + 1}/${new Date().getFullYear()}`,
                reference_id: referenceId // Store reference ID for payment verification
            };
            const response_order = await OrderAPI.post_order(data_order);

            // 4. Create order details for each product
            const data_carts = JSON.parse(localStorage.getItem('carts'));
            for (let i = 0; i < data_carts.length; i++) {
                const data_detail_order = {
                    id_order: response_order._id,
                    id_product: data_carts[i].id_product,
                    name_product: data_carts[i].name_product,
                    price_product: data_carts[i].price_product,
                    count: data_carts[i].count,
                    size: data_carts[i].size
                };
                await Detail_OrderAPI.post_detail_order(data_detail_order);
            }
            
            // Store order info for later reference
            const orderInfo = {
                order_id: response_order._id,
                reference_id: referenceId
            };
            localStorage.setItem('qr_payment_order', JSON.stringify(orderInfo));
            setOrderData(orderInfo);
            
            // Show QR code modal
            setShowQRModal(true);
            setIsProcessing(false);
            
        } catch (error) {
            console.error("QR payment error:", error);
            setPaymentError(t('payment_failed') + ': ' + (error.message || "Unknown error"));
            setIsProcessing(false);
        }
    };
    
    // Function to handle payment confirmation after QR code scan
    const handleConfirmQRPayment = async () => {
        try {
            setIsProcessing(true);
            
            // Get stored order information
            const qrPaymentOrder = orderData || JSON.parse(localStorage.getItem('qr_payment_order'));
            
            if (!qrPaymentOrder || !qrPaymentOrder.order_id) {
                throw new Error("Order information not found");
            }
            
            // Update order as paid
            await axios.patch('https://api.huytehuy.id.vn/api/order/updatePaymentStatus', {
                order_id: qrPaymentOrder.order_id,
                pay: true
            });
            
            // Update inventory for each product
            const data_carts = JSON.parse(localStorage.getItem('carts'));
            for (let i = 0; i < data_carts.length; i++) {
                await axios.patch('https://api.huytehuy.id.vn/api/admin/product/updateDepository', {
                    _id: data_carts[i].id_product,
                });
            }
            
            // Send email confirmation
            const storedInfo = JSON.parse(localStorage.getItem('information'));
            const data_email = {
                id_order: qrPaymentOrder.order_id,
                total: total,
                fullname: storedInfo.fullname,
                phone: storedInfo.phone,
                feeship: price,
                address: storedInfo.address,
                email: storedInfo.email,
                subtotal: total - price,
                data_carts: data_carts,
            };
            await OrderAPI.post_email(data_email);
            
            // Clean up localStorage
            localStorage.removeItem('information');
            localStorage.removeItem('total_price');
            localStorage.removeItem('price');
            localStorage.removeItem('id_coupon');
            localStorage.removeItem('coupon');
            localStorage.removeItem('qr_payment_order');
            localStorage.setItem('carts', JSON.stringify([]));
            
            // Close the modal
            setShowQRModal(false);
            
            // Update cart count
            const action_count_change = changeCount(count_change);
            dispatch(action_count_change);
            
            // Redirect to success page
            history.push('/success');
            
        } catch (error) {
            console.error("Error confirming payment:", error);
            setPaymentError(t('payment_verification_error'));
            setIsProcessing(false);
        }
    };

    // Handle modal close
    const handleCloseQRModal = () => {
        setShowQRModal(false);
        // Note: Order remains in database as pending
    };

    // Check URL for transaction_id parameter when returning from SePay
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const returnedTransactionId = urlParams.get('transaction_id');
        
        const validateTransaction = async () => {
            try {
                // Check if we're returning from SePay
                if (returnedTransactionId) {
                    setIsProcessing(true);
                    
                    // Get stored transaction info
                    const storedTransaction = JSON.parse(localStorage.getItem('sepay_transaction'));
                    if (storedTransaction && storedTransaction.transaction_id === returnedTransactionId) {
                        
                        // Verify transaction status with SePay API
                        const transactionStatus = await checkTransactionStatus(returnedTransactionId);
                        
                        if (transactionStatus.status === "completed" || transactionStatus.status === "success") {
                            // Update order as paid
                            await axios.patch('https://api.huytehuy.id.vn/api/order/updatePaymentStatus', {
                                order_id: storedTransaction.order_id,
                                pay: true
                            });
                            
                            // Update inventory for each product
                            const data_carts = JSON.parse(localStorage.getItem('carts'));
                            for (let i = 0; i < data_carts.length; i++) {
                                await axios.patch('https://api.huytehuy.id.vn/api/admin/product/updateDepository', {
                                    _id: data_carts[i].id_product,
                                });
                            }
                            
                            // Send email confirmation
                            const information = JSON.parse(localStorage.getItem('information'));
                            const data_email = {
                                id_order: storedTransaction.order_id,
                                total: total,
                                fullname: information.fullname,
                                phone: information.phone,
                                feeship: price,
                                address: information.address,
                                email: information.email,
                                subtotal: total - price,
                                data_carts: data_carts,
                            };
                            await OrderAPI.post_email(data_email);
                            
                            // Notify admin about new order
                            // socket.emit('send_order', "Có người vừa đặt hàng qua SePay");
                            
                            // Clean up localStorage
                            localStorage.removeItem('information');
                            localStorage.removeItem('total_price');
                            localStorage.removeItem('price');
                            localStorage.removeItem('id_coupon');
                            localStorage.removeItem('coupon');
                            localStorage.removeItem('sepay_transaction');
                            localStorage.setItem('carts', JSON.stringify([]));
                            
                            // Update cart count
                            const action_count_change = changeCount(count_change);
                            dispatch(action_count_change);
                            
                            // Redirect to success page
                            history.push('/success');
                        } else {
                            // Payment failed or pending
                            setPaymentError(t('payment_verification_failed'));
                            history.push('/checkout'); // Return to checkout
                        }
                    }
                    
                    setIsProcessing(false);
                }
            } catch (error) {
                console.error("Error validating transaction:", error);
                setPaymentError(t('payment_verification_error'));
                setIsProcessing(false);
            }
        };
        
        if (returnedTransactionId) {
            validateTransaction();
        }
    }, []);

    return (
        <div className="sepay-container">
            {paymentError && <div className="payment-error" style={{ color: 'red', marginBottom: '10px' }}>{paymentError}</div>}
            
            <button 
                onClick={handleQRCodePayment} 
                disabled={isProcessing}
                className="sepay-button"
                style={{
                    background: '#2E77AE',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    width: '100%',
                    maxWidth: '300px',
                    marginBottom: '10px'
                }}
            >
                {isProcessing ? t('Processing...') : t('QR')}
            </button>
            
            {/* <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                {t('Secure payment via SePay')}
            </div> */}

            {/* QR Code Modal - Updated to match the screenshot */}
            <Modal
                show={showQRModal}
                onHide={handleCloseQRModal}
                centered
                backdrop="static"
                keyboard={false}
                size="md"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('Scan QR Code to Pay')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9', marginBottom: '15px' }}>
                            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                                {t('Payment details')}:
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                {t('Amount')}: {new Intl.NumberFormat('vi-VN').format(total)} VNĐ
                            </div>
                            <div style={{ marginBottom: '5px' }}>
                                {t('Reference')}: {orderReference}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                                {t('Please include the reference code in your payment')}
                            </div>
                        </div>
                        
                        {/* Centered QR Code */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <img 
                                src={qrCodeUrl} 
                                alt="Payment QR Code" 
                                style={{ 
                                    width: '240px', 
                                    height: '240px',
                                    border: '1px solid #eee', 
                                    borderRadius: '4px' 
                                }} 
                            />
                        </div>
                        
                        <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
                            {t('Please click "I have completed the payment" after making the transfer')}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ justifyContent: 'center' }}>
                    <button
                        onClick={handleCloseQRModal}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        {t('Cancel')}
                    </button>
                    {/* Removed the "I have completed the payment" button as requested */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}
export default SePay;