import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Global from '../Image/HUYTEHUY.png'

Footer.propTypes = {

};

function Footer(props) {
    const { t } = useTranslation();
    
    return (
        <div className="footer">
            <div className="footer-static-middle">
                <div className="container">
                    <div className="footer-logo-wrap pt-50 pb-35">
                        <div className="row">
                            <div className="col-lg-4 col-md-6">
                                <div className="footer-logo">
                                    <img src={Global} style={{ width: '10rem'}} alt="Footer Logo" />
                                    <p className="info">
                                        {t('ecommerce_website')}
                                    </p>
                                </div>
                                <ul className="des">
                                    <li>
                                        <span>{t('address')}: </span>
                                        268 Lý Thường Kiệt, Phường 14, Quận 10, Thành phố Hồ Chí Minh, Vietnam
                                    </li>
                                    <li>
                                        <span>{t('phone')}: </span>
                                        <a href="tel:0366889853">0366889853</a>
                                    </li>
                                    <li>
                                        <span>Email: </span>
                                        <a href="mailto://huy.phamkhmtjapan@hcmut.edu.vn">huy.phamkhmtjapan@hcmut.edu.vn</a>
                                    </li>
                                </ul>
                            </div>
                            <div className="col-lg-2 col-md-3 col-sm-6">
                                <div className="footer-block">
                                    <h3 className="footer-block-title">{t('products')}</h3>
                                    <ul>
                                        <li><Link to="/shop/all">{t('discount')}</Link></li>
                                        <li><Link to="/shop/all">{t('new_products')}</Link></li>
                                        <li><Link to="/shop/all">{t('best_selling')}</Link></li>
                                        <li><Link to="/contact">{t('contact')}</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-lg-2 col-md-3 col-sm-6">
                                <div className="footer-block">
                                    <h3 className="footer-block-title">{t('company')}</h3>
                                    <ul>
                                        <li><Link to="/contact">{t('delivery')}</Link></li>
                                        <li><Link to="/contact">{t('legal_notice')}</Link></li>
                                        <li><Link to="/">{t('about_us')}</Link></li>
                                        <li><Link to="/contact">{t('contact')}</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-lg-4">  
                                <div className="footer-newsletter">
                                    <h4>{t('newsletter_signup')}</h4>
                                    <form action="#" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="footer-subscribe-form validate" target="_blank">
                                        <div id="mc_embed_signup_scroll">
                                            <div id="mc-form" className="mc-form subscribe-form form-group" >
                                                <input id="mc-email" type="email" autoComplete="off" placeholder={t('email_placeholder')} />
                                                <button className="btn" id="mc-submit">{t('register')}</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Footer;