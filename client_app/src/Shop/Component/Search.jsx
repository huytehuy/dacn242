import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';



Search.propTypes = {
    handler_Search: PropTypes.func
};

Search.defaultProps = {
    handler_Search: null
}

function Search(props) {
    const { t } = useTranslation();
    const { handler_Search } = props

    const [search, set_search] = useState('')

    const onChangeText = (e) => {

        const value = e.target.value

        set_search(value)

        if (!handler_Search) {
            return
        }

        handler_Search(value)

    }

    return (
        <form action="#">
            <input type="text" className="li-search-field" placeholder={t('Search.')} value={search} onChange={onChangeText} />
            <button type="submit" className="li-search-btn" disabled={true}><i className="fa fa-search"></i></button>
        </form>
    );
}

export default Search;