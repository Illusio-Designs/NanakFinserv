import React from 'react';
import config from './config/environment';

const EnvDebug = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Environment Debug</h4>
      <p><strong>API_URL:</strong> {config.API_URL}</p>
      <p><strong>DOWNLOAD_URL:</strong> {config.DOWNLOAD_URL}</p>
      <p><strong>BASE_URL:</strong> {config.BASE_URL}</p>
      <p><strong>NODE_ENV:</strong> {config.NODE_ENV}</p>
      <p><strong>IS_PRODUCTION:</strong> {config.IS_PRODUCTION ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default EnvDebug;
