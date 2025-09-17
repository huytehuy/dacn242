import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import User from '../API/User';
import logo from '../Image/HUYTEHUY.png'
import { changeCount } from '../Redux/Action/ActionCount';
import { addSession, deleteSession } from '../Redux/Action/ActionSession';
import Product from '../API/Product';
import { addSearch } from '../Redux/Action/ActionSearch';
import CartsLocal from './CartsLocal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import './styles.css';
import SaleAPI from '../API/SaleAPI';
import axios from "axios";
import { jwtDecode } from 'jwt-decode'
import { useTranslation } from 'react-i18next';
import "/node_modules/flag-icons/css/flag-icons.min.css";
import flagVN from '../Image/vietnam.png'; // Thêm ảnh cờ Việt Nam
import flagUS from '../Image/en.jpg'; // Thêm ảnh cờ Mỹ


function Header(props) {
    // State count of cart
    const [count_cart, set_count_cart] = useState(0)
    const [total_price, set_total_price] = useState(0)
    const [carts_mini, set_carts_mini] = useState([])
    const { t, i18n } = useTranslation();
    const handleChangeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };
    // Hàm này để khởi tạo localStorage dùng để lưu trữ giỏ hàng
    // Và nó sẽ chạy lần đầu
    useEffect(() => {
        if (localStorage.getItem('carts') !== null) {
            set_carts_mini(JSON.parse(localStorage.getItem('carts')));
        } else {
            localStorage.setItem('carts', JSON.stringify([]))
        }
    }, [])

    // Xử lý thanh navigation
    const [header_navbar, set_header_navbar] = useState('header-bottom header-sticky')
    window.addEventListener('scroll', () => {
        if (window.pageYOffset < 200) {
            set_header_navbar('header-bottom header-sticky')
        } else {
            set_header_navbar('header-bottom header-sticky offset_navigation animate__animated animate__fadeInUp')
        }
    })
    const dispatch = useDispatch()

    //Sau khi F5 nó sẽ kiểm tra nếu phiên làm việc của Session vẫn còn thì nó sẽ tiếp tục
    // đưa dữ liệu vào Redux
    if (sessionStorage.getItem('id_user')) {
        const action = addSession(sessionStorage.getItem('id_user'))
        dispatch(action)
    }
    //Get IdUser từ redux khi user đã đăng nhập
    // Get carts từ redux khi user chưa đăng nhập
    // const carts = useSelector(state => state.Cart.listCart)

    const [active_user, set_active_user] = useState(false)

    const [user, set_user] = useState({})

    // Hàm này dùng để hiện thị
    useEffect(() => {// user đã đăng nhâp
        let mounted = true;

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('jwt');
                if (!token) return; // Nếu không có token thì không decode
                const decoded = jwtDecode(token);
                const response = await User.Get_User(decoded.id)
                if (mounted) {
                    set_user(response)
                    if (response) {
                        set_active_user(true)
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }

        fetchData()

        // Cleanup function
        return () => {
            mounted = false;
        }
    }, [])
    // Hàm này dùng để xử lý phần log out
    const handler_logout = () => {
        const action = deleteSession('')
        dispatch(action)
        sessionStorage.clear()
        localStorage.clear('jwt')
        window.location.reload()
    }

    // Get trạng thái từ redux khi user chưa đăng nhập
    const count = useSelector(state => state.Count.isLoad)
    // Hàm này dùng để load lại dữ liệu giỏ hàng ở phần header khi có bất kì thay đổi nào
    // Phụ thuộc vào thằng redux count
    useEffect(() => {
        if (count) {
            showData(JSON.parse(localStorage.getItem('carts')), 0, 0)
            const action = changeCount(count)
            dispatch(action)
        }
    }, [count])

    // Hàm này là hàm con chia ra để xử lý
    function showData(carts, sum, price) {
        carts.map(value => {
            sum += value.count
            price += parseInt(value.price_product) * parseInt(value.count)
        })
        set_count_cart(sum)
        set_total_price(price)
        set_carts_mini(carts)
    }


    // Hàm này dùng để xóa carts_mini
    const handler_delete_mini = (id_cart) => {
        CartsLocal.deleteProduct(id_cart)
        const action_change_count = changeCount(count)
        dispatch(action_change_count)
    }
    // state keyword search
    const [keyword_search, set_keyword_search] = useState('')
    const [products, set_products] = useState([])
    const [product_category, set_product_category] = useState([])
    useEffect(() => {
        const fetchData = async () => {
            const response = await Product.Get_All_Product()

            set_products(response)
        }
        fetchData()
    }, [])
    useEffect(() => {
        const fetchData = async () => {
            const response = await SaleAPI.getList()
            set_product_category(response)
        }
        fetchData()
    }, [])


    // Hàm này trả ra list product mà khách hàng tìm kiếm
    // sử dụng useMemo để performance hơn vì nếu mà dữ liệu mới giống với dữ liệu cũ thì nó sẽ lấy cái
    // Không cần gọi API để tạo mới data
    const search_header = useMemo(() => {
        const new_data = products.filter(value => {
            // const nameMatch = value?.name_product?.toUpperCase().indexOf(keyword_search.toUpperCase()) !== -1;
            // const categoryMatch = value?.id_category?.category?.toUpperCase().indexOf(keyword_search.toUpperCase()) !== -1;

            // Get product name and search term, handling null/undefined cases
            const productName = (value?.name_product || '').toUpperCase();
            const productCategory = (value?.id_category?.category || '').toUpperCase();
            const searchTerms = keyword_search.toUpperCase().trim().split(/\s+/);
            // Check if ALL search terms are found in either the product name OR category
            return searchTerms.every(term =>
                productName.includes(term) || productCategory.includes(term)
            );
        })
        return new_data
    }, [keyword_search])
    const handler_search = (e) => {
        e.preventDefault()
        // Đưa vào redux để qua bên trang search lấy query tìm kiếm
        const action = addSearch(keyword_search)
        console.log(action)
        dispatch(action)
        // set cho nó cái session
        sessionStorage.setItem('search', keyword_search)
        window.location.replace('/search')
    }
    const [isCartVisible, setCartVisible] = useState(false);
    const [isUserVisible, setUserVisible] = useState(false);
    const [isSearchVisible, setSearchVisible] = useState(false);
    const cartRef = useRef(null);
    const userRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                // Clicked outside the mini cart
                setCartVisible(false);
            }
            if (userRef.current && !userRef.current.contains(event.target)) {
                // Clicked outside the mini cart
                setUserVisible(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                // Clicked outside the mini cart
                setSearchVisible(false);
            }
        };
        if (isCartVisible || isUserVisible || isSearchVisible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isCartVisible, isUserVisible, isSearchVisible]);

    const toggleCartVisibility = () => {
        setCartVisible(!isCartVisible);
    };
    const toggleUserVisibility = () => {
        if (active_user === true)
            setUserVisible(!isUserVisible);
    };
    const history = useHistory();
    const handleSignInClick = () => {
        // Use history.push to navigate to the "/signin" route
        localStorage.setItem('history', history.location.pathname)
        history.push('/signin');
    }
    const [file, setFile] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [products1, setProducts1] = useState(null);  // Thay đổi biến từ products thành products1
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

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
    // Add responsive menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobileView(mobile);
            if (!mobile) setMobileMenuOpen(false); // ensure menu closed on desktop
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);

    return (
        <header>
            <div className="header-middle pl-sm-0 pr-sm-0 pl-xs-0 pr-xs-0 ">
                <div className="container pb_header">
                    <div className="row">
                        {/* NOTE: show the desktop logo only when NOT mobile */}
                        { !isMobileView && (
                            <div className="col-lg-3">
                            	<div className="logo pb-sm-30 pb-xs-30">
                            		<Link to="/">
                            			<img src={logo} style={{ width: '5rem' }} />
                            		</Link>
                            	</div>
                            </div>
                        )}

                        {/* NOTE: use isMobileView (not isMobile) */}
                        { !isMobileView && (
                            <div className="col-lg-9 pl-0 ml-sm-15 ml-xs-15 d-flex justify-content-between align-items-center">
                                <form action="/search" className="hm-searchbox" style={{ width: "50px" }} onSubmit={handler_search}>
                                    <input type="text" placeholder={t('Search.')} value={keyword_search} onChange={(e) => { set_keyword_search(e.target.value); setSearchVisible(true) }} />
                                    <button className="li-btn" type="submit"><i className="fa fa-search"></i></button>

                                    {isSearchVisible &&
                                        keyword_search && <div className="show_search_product" ref={searchRef}>
                                            {
                                                search_header && search_header.map(value => (
                                                    <>
                                                        <Link to={`/detail/${value._id}`} onClick={() => setSearchVisible(false)} style={{ padding: '.8rem' }}>
                                                            <div className="hover_box_search d-flex" key={value._id}>
                                                                <img className="img_list_search" src={value.image} alt="" />
                                                                <div className="group_title_search" style={{ marginTop: '2.7rem' }}>
                                                                    <h6 className="title_product_search">{value.name_product}</h6>
                                                                    {
                                                                        (() => {
                                                                            const index = product_category.findIndex(obj => {
                                                                                return Object.keys(obj.id_product).some(key => obj.id_product[key] === value._id);
                                                                            });

                                                                            if (index !== -1) {
                                                                                return (
                                                                                    <>
                                                                                        <del className="new-price">{new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(product_category[index].id_product?.price_product) + ' VNĐ'}</del>
                                                                                        <span className="new-price" style={{ color: 'red' }}>
                                                                                            {new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' })
                                                                                                .format(parseInt(product_category[index].id_product?.price_product) - ((parseInt(product_category[index].id_product?.price_product) * parseInt(product_category[index].promotion)) / 100)) + ' VNĐ'}
                                                                                        </span>
                                                                                    </>
                                                                                );
                                                                            } else {
                                                                                return <span className="price_product_search">{new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(value.price_product) + ' VNĐ'}</span>;
                                                                            }
                                                                        })()
                                                                    }

                                                                </div>
                                                            </div>

                                                        </Link>

                                                    </>
                                                ))
                                            }
                                        </div>
                                    }
                                </form>
                                <div className="hm-searchbox1" onSubmit={handler_search}>
                                    <Link to={`/imgSearch`}  ><button className="li-btn" type="submit"><i className="fa fa-camera"></i></button>/</Link>
                                </div>

                                {/* replace single cart button with original desktop minicart */}
                                <div className="ml-15 header-middle-right d-flex justify-content-between align-items-center" onClick={toggleCartVisibility}>
                                    <ul className="hm-menu d-flex justify-content-between align-items-center">
                                        <li className="hm-wishlist d-flex justify-content-between align-items-center">
                                            <div className="hm-minicart d-flex">
                                                <div className="hm-minicart-trigger"
                                                    data-toggle="collapse"
                                                    data-target="#collapse_carts"
                                                    aria-expanded="false"
                                                    aria-controls="collapse_carts">
                                                    <span className="item-icon"></span>
                                                    <span className="item-text">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(total_price) + ' VNĐ'}
                                                        <span className="cart-item-count">{count_cart}</span>
                                                    </span>
                                                </div>
                                                <span></span>
                                                {isCartVisible && (
                                                    <div className="minicart" ref={cartRef}>
                                                        <ul className="minicart-product-list">
                                                            {carts_mini && carts_mini.map((value, index) => (
                                                                <li key={index}>
                                                                    <Link to={`/detail/${value.id_product}`} className="minicart-product-image">
                                                                        <img src={value.image} alt="cart products" />
                                                                    </Link>
                                                                    <div className="minicart-product-details">
                                                                        <h6>
                                                                            <Link to={`/detail/${value.id_product}`}>{value.name_product}</Link>
                                                                        </h6>
                                                                        <span>
                                                                            {new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(value.price_product) + ' VNĐ'} x {value.count}
                                                                        </span>
                                                                    </div>
                                                                    <a className="close" onClick={() => handler_delete_mini(value.id_cart)}>
                                                                        <i className="fa fa-close"></i>
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <p className="minicart-total">{t("Total")}: <span>{new Intl.NumberFormat('vi-VN', { style: 'decimal', decimal: 'VND' }).format(total_price) + ' VNĐ'}</span></p>
                                                        <div className="minicart-button">
                                                            <Link to="/cart" className="li-button li-button-fullwidth li-button-dark">
                                                                <span>{t("View cart")}</span>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop navbar: render only when NOT mobile */}
                { !isMobileView && (
                    <div className={header_navbar} style={{ backgroundColor: '#00897B' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'absolute', right: '10px', top: '5px' }}>
                            <span style={{ cursor: 'pointer' }} onClick={() => handleChangeLanguage('vi')}>
                                <img
                                    src={flagVN}
                                    alt="Vietnamese"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        border: i18n.language === 'vi' ? '2px solid #00897B' : '2px solid transparent',
                                        borderRadius: '50%',
                                        boxSizing: 'border-box',
                                        objectFit: 'cover'
                                    }}
                                />
                            </span>
                            <span style={{ cursor: 'pointer' }} onClick={() => handleChangeLanguage('en')}>
                                <img
                                    src={flagUS}
                                    alt="English"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        border: i18n.language === 'en' ? '2px solid #00897B' : '2px solid transparent',
                                        borderRadius: '50%',
                                        boxSizing: 'border-box',
                                        objectFit: 'cover'
                                    }}
                                />
                            </span>
                        </div>
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="hb-menu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <nav>
                                            <ul>
                                                <li className="dropdown-holder" ><Link to="/" style={{color:'white'}}>{t('Home')}</Link></li>
                                                <li className="megamenu-holder"><Link to="/shop/all" style={{color:'white'}}>{t('Category')}</Link>
                                                </li>
                                                <li><Link to="/event" style={{color:'white'}}>{t('Event')}</Link></li>
                                                <li><Link to="/contact" style={{color:'white'}}>{t('Contact')}</Link></li>
                                            </ul>
                                        </nav>

                                        <div >
                                            <div className="d-flex justify-content-end username" onClick={toggleUserVisibility} style={{ position: 'relative', cursor: 'pointer' }}>
                                                <div>
                                                    {
                                                        active_user ? (
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <FontAwesomeIcon icon={faUser} fontSize={20} style={{ marginRight: 10 }} />{user.fullname}</div>) : (
                                                            <div className="hb-menu">
                                                                <nav>
                                                                    <ul>
                                                                        <li style={{ textTransform: 'uppercase' }} onClick={() => handleSignInClick()}>{t('Login')}</li>
                                                                    </ul>
                                                                </nav>
                                                            </div>
                                                        )
                                                    }
                                                </div>

                                                {isUserVisible && active_user &&
                                                    (
                                                        <div className="ul_setting" ref={userRef}>
                                                            <ul style={{ width: 100 }} className='dropdown' >
                                                                <li className="li_setting"><Link to={`/profile/${user._id}`} className="li_setting">{t('Profile')}</Link></li>
                                                                <li className="li_setting"><Link to="/history" className="li_setting">{t('Order_Status')}</Link></li>
                                                                <li className="li_setting"><a onClick={handler_logout}>{t('Logout')}</a></li>
                                                            </ul>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Responsive nav (mobile) */}
            <div className="d-lg-none" style={{ backgroundColor: '#00897B', padding: '0.5rem 1rem' }}>
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <Link to="/" className="navbar-brand" style={{ color: '#fff' }}>
                            <img src={logo} alt="Logo" style={{ width: '40px', height: '40px' }} />
                        </Link>
                        {/* Hamburger button only on small screens */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                                 type="button"
                                 onClick={toggleMobileMenu}
                                 aria-expanded={mobileMenuOpen}
                                 aria-label="Toggle menu"
                                 style={{
                                     background: 'transparent',
                                     border: 'none',
                                     padding: 8,
                                     cursor: 'pointer',
                                     display: 'inline-flex',
                                     flexDirection: 'column',
                                     justifyContent: 'space-between',
                                     height: 28
                                 }}
                             >
                                 <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
                                 <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
                                 <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
                            </button>

                            {/* mobile cart button - toggles the same single minicart */}
                            <button
                                type="button"
                                onClick={toggleCartVisibility}
                                aria-expanded={isCartVisible}
                                aria-label="Toggle cart"
                                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <i className="fa fa-shopping-cart" />
                                <span style={{ marginLeft: 6 }}>{count_cart}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div style={ mobileMenuOpen ? { display: 'block', listStyle: 'none', margin: 0, padding: 0, background: '#00897B' } : { display: 'none' } }>
                    {/* Mobile search */}
                    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <form onSubmit={handler_search} style={{ display: 'flex', gap: 8 }}>
                            <input type="text" placeholder={t('Search.')}
                                value={keyword_search}
                                onChange={(e) => { set_keyword_search(e.target.value); setSearchVisible(true); }}
                                style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    borderRadius: 4,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: '#fff'
                                }}
                            />
                            <button type="submit" style={{ padding: '8px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', borderRadius: 4 }}>
                                <i className="fa fa-search"></i>
                            </button>
                        </form>

                        {isSearchVisible && keyword_search && (
                            <div className="show_search_product_mobile" ref={searchRef} style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                                {search_header && search_header.map(value => (
                                    <Link key={value._id} to={`/detail/${value._id}`} onClick={() => { setSearchVisible(false); setMobileMenuOpen(false); }} style={{ display: 'flex', gap: 8, padding: '.5rem', alignItems: 'center', color: '#fff', textDecoration: 'none' }}>
                                        <img src={value.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                                        <div>
                                            <div style={{ fontSize: 14 }}>{value.name_product}</div>
                                            <div style={{ fontSize: 12, opacity: 0.85 }}>{new Intl.NumberFormat('vi-VN').format(value.price_product)} VNĐ</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile image search: file input + upload */}
                    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input id="mobile-img-search" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <label htmlFor="mobile-img-search" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
                                <i className="fa fa-camera" />&nbsp;{t('Choose image')}
                            </label>
                            <button onClick={handleUpload} disabled={!file} style={{ padding: '8px 12px', background: '#fff', color: '#00897B', borderRadius: 4, border: 'none' }}>
                                {loading ? t('Uploading...') : t('Upload')}
                            </button>
                        </div>
                        {error && <div style={{ marginTop: 8, color: '#ffcccc' }}>{error}</div>}

                        {/* show predictions/products1 if available */}
                        {predictions && products1 && (
                            <div style={{ marginTop: 8 }}>
                                {products1.map((p, idx) => (
                                    <div key={idx} style={{ padding: '.4rem 0', borderTop: idx ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                        <Link to={`/detail/${p._id}`} onClick={() => { setMobileMenuOpen(false); }} style={{ color: '#fff', textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <img src={p.image} alt={p.name_product} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                                            <div>
                                                <div style={{ fontSize: 14 }}>{p.name_product}</div>
                                                <div style={{ fontSize: 12, opacity: 0.85 }}>{new Intl.NumberFormat('vi-VN').format(p.price_product)} VNĐ</div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile navigation links (moved BELOW image-search) */}
                    <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <nav>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ padding: '.6rem 0' }}>
                                    <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>{t('Home')}</Link>
                                </li>
                                <li style={{ padding: '.6rem 0' }}>
                                    <Link to="/shop/all" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>{t('Category')}</Link>
                                </li>
                                <li style={{ padding: '.6rem 0' }}>
                                    <Link to="/event" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>{t('Event')}</Link>
                                </li>
                                <li style={{ padding: '.6rem 0' }}>
                                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>{t('Contact')}</Link>
                                </li>
                                <li style={{ padding: '.6rem 0', marginTop: 6 }}>
                                    {active_user ? (
                                        <Link to={`/profile/${user._id}`} onClick={() => setMobileMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>{t('Profile')}</Link>
                                    ) : (
                                        <button onClick={() => { setMobileMenuOpen(false); handleSignInClick(); }} style={{ background: 'transparent', border: 'none', color: '#fff', padding: 0 }}>{t('Login')}</button>
                                    )}
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Single shared minicart panel (mobile only) */}
            {isCartVisible && isMobileView && (
                 <div ref={cartRef} style={{
                     position: 'absolute',
                     right: 12,
                     top: isMobileView ? 68 : 92,
                     width: isMobileView ? '90%' : 360,
                     maxHeight: 420,
                     overflowY: 'auto',
                     background: '#fff',
                     color: '#000',
                     boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                     borderRadius: 6,
                     zIndex: 9999,
                     padding: 12
                 }}>
                     <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                         {carts_mini && carts_mini.length ? carts_mini.map((value, index) => (
                             <li key={index} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                 <Link to={`/detail/${value.id_product}`} onClick={() => setCartVisible(false)}>
                                     <img src={value.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                                 </Link>
                                 <div style={{ flex: 1 }}>
                                     <Link to={`/detail/${value.id_product}`} onClick={() => setCartVisible(false)} style={{ color: '#000', textDecoration: 'none', fontSize: 14 }}>{value.name_product}</Link>
                                     <div style={{ fontSize: 13, color: '#666' }}>{new Intl.NumberFormat('vi-VN').format(value.price_product)} VNĐ × {value.count}</div>
                                 </div>
                                 <button onClick={() => handler_delete_mini(value.id_cart)} style={{ background: 'transparent', border: 'none', fontSize: 18, color: '#999' }} aria-label="remove">×</button>
                             </li>
                         )) : <li style={{ padding: 8 }}>{t('No items')}</li>}
                     </ul>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                         <strong>{t('Total')}:</strong>
                         <span>{new Intl.NumberFormat('vi-VN').format(total_price)} VNĐ</span>
                     </div>
                     <div style={{ marginTop: 10, textAlign: 'right' }}>
                         <Link to="/cart" onClick={() => setCartVisible(false)} style={{ padding: '8px 12px', background: '#00897B', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>{t('View cart')}</Link>
                     </div>
                 </div>
             )}
        </header>
    );
}
export default Header;