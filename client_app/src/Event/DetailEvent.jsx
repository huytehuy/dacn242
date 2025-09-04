import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import CouponAPI from '../API/CouponAPI';
import './Event.css'
import { useTranslation } from 'react-i18next';
function DetailEvent(props) {

    const { id } = useParams()

    const [coupon, setCoupon] = useState({})
    const { t } = useTranslation();
    useEffect(() => {

        const fetchData = async () => {

            const resposne = await CouponAPI.getCoupon(id)

            setCoupon(resposne)

        }

        fetchData()

    }, [id])

    return (
        <div>
            <div className="breadcrumb-area">
                <div className="container">
                    <div className="breadcrumb-content">
                        <ul>
                            <li><a href="index.html">{t('Home')}</a></li>
                            <li className="active">{t('Event')}</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="container" style={{ marginTop: '3rem' }}>
                <h1 className="h4_event">{coupon.describe}</h1>
                <div style={{ marginTop: '2rem' }}>
                    <a className="a_event">{t('Sales')}</a>
                </div>
                <div style={{ marginTop: '2rem' }}>
                    <span style={{ fontSize: '1.2rem', color: '#646464', fontWeight: 'bold' }}>{t('Opportunity_to_receive_more_discounts_when_buying_products_at_our_shop')}</span>
                    <br />
                    <span style={{ fontSize: '1.05rem' }}>{t('Just_buy')} <i style={{ color: 'red' }}>{coupon.count}</i> {t('times')} {t('will_get_discount')}:</span>
                    <li style={{ fontSize: '1.05rem' }}>{t('Code')}: <i style={{ color: 'red' }}>{coupon.code}</i></li>
                    <li style={{ fontSize: '1.05rem' }}>{t('Remaining')}: <i style={{ color: 'red' }}>{coupon.count}</i></li>
                    <span style={{ fontSize: '1.05rem' }}>{t('You_will_enter_the_code')} {t('APPLY_COUPON')} {t('in_your_cart')}.</span>
                    <br />
                    <span style={{ fontSize: '1.05rem' }}>{t('Note')}: <i style={{ color: 'red' }}>{t('Each_code_can_only_be_used_once')}</i></span>
                </div>
                <div style={{ padding: '3rem 0' }}>
                    <img style={{ width: '100%' }} src="https://cdn.tgdd.vn/hoi-dap/1321785/banner-la-gi-khac-gi-voi-poster-cach-de-thiet-ke-mot%20(2).jpg" alt="" />
                </div>
            </div>
        </div>
    );
}

export default DetailEvent;