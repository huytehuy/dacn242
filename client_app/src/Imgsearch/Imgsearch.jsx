import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroll-component';
import queryString from 'query-string'
import Product from '../API/Product';
import './index.css'
import { Link } from 'react-router-dom';
import axios from "axios";
import SaleAPI from '../API/SaleAPI';
import { useTranslation } from 'react-i18next';
Imgsearch.propTypes = {
    products: PropTypes.array,
    sort: PropTypes.string
};

Imgsearch.defaultProps = {
    products: [],
    sort: ''
}

function Imgsearch(props) {
    const { t } = useTranslation();
    const { sort } = props
    const [products, set_products] = useState([])
    const [page, set_page] = useState(1)

    const [show_load, set_show_load] = useState(true)

    useEffect(() => {

        setTimeout(() => {

            const fetchData = async () => {

                const params = {
                    page: page,
                    count: '6',
                    search: sessionStorage.getItem('search')
                }

                const query = '?' + queryString.stringify(params)

                const response = await Product.get_search_list(query)

                if (response.length < 1) {
                    set_show_load(false)
                }

                set_products(prev => [...prev, ...response])

            }

            fetchData()

        }, 2500)

    }, [page])
    const [file, setFile] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [products1, setProducts1] = useState(null);  // Thay đổi biến từ products thành products1
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [product_category, set_product_category] = useState([])
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };
    useEffect(() => {
        const fetchData = async () => {
            const response = await SaleAPI.getList()
            set_product_category(response)
        }
        fetchData()
    }, [])
    if (sort === 'DownToUp') {
        products.sort((a, b) => {
            return a.price_product - b.price_product
        });
    }
    else if (sort === 'UpToDown') {
        products.sort((a, b) => {
            return b.price_product - a.price_product
        });
    }
    const handleUpload = async () => {
        if (!file) {
            alert('Please select an image');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            setError(null);

            // Gửi yêu cầu đến backend Flask API
            const response = await axios.post('https://api.huytehuy.id.vn/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Nhận kết quả từ API và cập nhật state
            const { predictions, products } = response.data;
            setPredictions(predictions);
            setProducts1(products);  // Sử dụng products1 thay cho products
            setLoading(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('An error occurred while uploading the image');
            setLoading(false);
        }
    };

    return (

        <div className="content-wraper pt-60 pb-60">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">

                        <div className="shop-products-wrapper">
                            <div className="row">
                                <div className="col">

                                    <div className="upload-container">
                                        <h2>Chọn hỉnh ảnh để tìm kiếm</h2>

                                        <input className="w-100= p-2" type="file" onChange={handleFileChange} />
                                        <button
                                            className="upload-button"
                                            onClick={handleUpload}
                                            disabled={loading}
                                        >
                                            {loading ? 'Đang tìm...' : t('Search.')}
                                        </button>
                                    </div>

                                    {/* Form để tải ảnh lên */}
                                    {/* <input type="file" onChange={handleFileChange} /> */}
                                    {/* <button onClick={handleUpload} disabled={loading}>
                                        {loading ? 'Uploading...' : 'Upload Image'}
                                    </button> */}

                                    {/* Hiển thị sản phẩm tìm thấy (đã thay tên biến thành products1) */}
                                    {products1 && products1.length > 0 ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '24px',
                                                justifyContent: 'flex-start'
                                            }}
                                        >
                                            {products1.map(value => (
                                                <div
                                                    key={value._id}
                                                    className="product-layout-list"
                                                    style={{
                                                        flex: '1 1 300px',
                                                        maxWidth: '300px',
                                                        minWidth: '250px',
                                                        background: '#fff',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                        marginBottom: '24px',
                                                        padding: '16px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Link to={`/detail/${value._id}`} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
                                                        <div className="product-image" style={{ width: '100%', textAlign: 'center' }}>
                                                            <img
                                                                src={value.image}
                                                                alt="Li's Product Image"
                                                                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px' }}
                                                            />
                                                            <span className="sticker">{t("New")}</span>
                                                        </div>
                                                        <div className="product_desc" style={{ width: '100%', marginTop: '12px' }}>
                                                            <div className="product_desc_info">
                                                                <div className="product-review">
                                                                    <h5 className="manufacturer">{value.name_product}</h5>
                                                                    <div className="rating-box">
                                                                        <ul className="rating" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex' }}>
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <li key={i}><i className="fa fa-star" /></li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                                <h4>{value.name_product}</h4>
                                                                <div className="price-box">
                                                                    {
                                                                        (() => {
                                                                            const index = product_category.findIndex(obj => {
                                                                                return Object.keys(obj.id_product).some(key => obj.id_product[key] === value._id);
                                                                            });

                                                                            if (index !== -1) {
                                                                                return (
                                                                                    <>
                                                                                        <del className="new-price">{new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(product_category[index].id_product?.price_product) + ' VNĐ'}</del>
                                                                                        <br />
                                                                                        <span className="new-price" style={{ color: 'red' }}>
                                                                                            {new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' })
                                                                                                .format(parseInt(product_category[index].id_product?.price_product) - ((parseInt(product_category[index].id_product?.price_product) * parseInt(product_category[index].promotion)) / 100)) + ' VNĐ'}
                                                                                        </span>
                                                                                    </>
                                                                                );
                                                                            } else {
                                                                                return <span className="price_product_search" style={{ color: 'black' }}>{new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(value.price_product) + ' VNĐ'}</span>;
                                                                            }
                                                                        })()
                                                                    }
                                                                </div>
                                                                <p>{value.describe}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="upload-container1" style={{ width: '100%' }}>
                                            <p>{t("No_products_found")}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Hiển thị lỗi nếu có */}
                                {error && <div style={{ color: 'red' }}>{error}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Imgsearch;