import React from 'react';
import { useTranslation } from 'react-i18next';
function Contact() {
    const { t } = useTranslation();
    return (
        <div>
            <div className="breadcrumb-area">
                <div className="container">
                    <div className="breadcrumb-content">
                        <ul>
                            <li><a href="/">{t('Home')}</a></li>
                            <li className="active">{t('Contact')}</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="contact-main-page mt-60 mb-40 mb-md-40 mb-sm-40 mb-xs-40">
                <div className="container mb-60">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d346.4392710449575!2d106.65763344142754!3d10.771971600261708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ec3c161a3fb%3A0xef77cd47a1cc691e!2sHo%20Chi%20Minh%20City%20University%20of%20Technology%20(HCMUT)!5e0!3m2!1sen!2sus!4v1699190219273!5m2!1sen!2sus" width="600" height="450" style={{ border: '0' }} allowfullscreen="" loading="lazy"></iframe>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-5 offset-lg-1 col-md-12 order-1 order-lg-2">
                            <div className="contact-page-side-content">
                                <h3 className="contact-page-title">{t('Contact')}</h3>
                                {/* <p className="contact-page-message mb-25">
                                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quidem sapiente ab cum accusantium, incidunt nihil fugit similique? Reiciendis ex dignissimos libero iusto quos, consequuntur nobis tenetur a minima! Voluptatum, ab?
                                </p> */}
                                <div className="single-contact-block">
                                    <h4><i className="fa fa-fax"></i> {t('Address')}</h4>
                                    <p>268 Lý Thường Kiệt, Phường 14, Quận 10, Thành phố Hồ Chí Minh, Vietnam</p>
                                </div>
                                <div className="single-contact-block">
                                    <h4><i className="fa fa-phone"></i> {t('Phone')}</h4>
                                    <p>{t('Phone')}: 0366889853</p>
                                </div>
                                <div className="single-contact-block last-child">
                                    <h4><i className="fa fa-envelope-o"></i> {t('Email')}</h4>
                                    <p>huy.phamkhmtjapan@hcmut.edu.vn</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 order-2 order-lg-1">
                            <div className="contact-form-content pt-sm-55 pt-xs-55">
                                <h3 className="contact-page-title">{t('Feedback')}</h3>
                                <div className="contact-form">
                                    <form id="contact-form" action="http://demo.hasthemes.com/limupa-v3/limupa/mail.php" method="post">
                                        <div className="form-group">
                                            <label>{t('Full_Name')} <span className="required">*</span></label>
                                            <input type="text" name="customerName" id="customername" required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('Email')} <span className="required">*</span></label>
                                            <input type="email" name="customerEmail" id="customerEmail" required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('Subject')}</label>
                                            <input type="text" name="contactSubject" id="contactSubject" />
                                        </div>
                                        <div className="form-group mb-30">
                                            <label>{t('Message')}</label>
                                            <textarea name="contactMessage" id="contactMessage" ></textarea>
                                        </div>
                                        <div className="form-group">
                                            <input type="submit" value={t('Submit')} className="li-btn-3" name="submit" />
                                        </div>
                                    </form>
                                </div>
                                <p className="form-messege"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Contact;