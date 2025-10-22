import React, { useState } from 'react';

// CSS đơn giản để minh họa
const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    textAlign: 'center',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    color: 'white',
    marginTop: '10px',
  },
  divider: {
    margin: '20px 0',
    borderBottom: '1px solid #ccc',
    lineHeight: '0.1em',
  }
};

const LoginPage = () => {
  // URL của backend API
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  return (
    <div style={styles.container}>
      <h2>Đăng nhập CinemaGo</h2>
      {/* Thêm form đăng nhập thông thường của bạn ở đây */}
      <div style={styles.divider}></div>
      <a href={`${backendUrl}/auth/google`}>
        <button style={{...styles.button, ...styles.googleButton}}>Đăng nhập với Google</button>
      </a>
    </div>
  );
};

export default LoginPage;
