import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './store';
import { Provider } from 'react-redux';
import './i18n/i18n'; // nhớ import file cấu hình i18next

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </React.StrictMode>
  </Provider>,
  document.getElementById('root')
);

reportWebVitals();
