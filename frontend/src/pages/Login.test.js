// src/pages/Login.test.js

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import apiService from '../services/apiService';
import authService from '../services/authService';

// ======================= MOCKS SETUP =======================

jest.mock('../services/apiService');
jest.mock('../services/authService');

const mockNavigate = jest.fn();
const mockToast = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const MockComponent = ({ children, ...props }) => <div {...props}>{children}</div>;

  return {
    Box: MockComponent,
    Container: MockComponent,
    Card: MockComponent,
    CardBody: MockComponent,
    VStack: MockComponent,
    HStack: MockComponent,
    FormControl: MockComponent,
    FormLabel: ({ children }) => <label>{children}</label>,
    Input: (props) => <input {...props} />,
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
    Text: ({ children }) => <p>{children}</p>,
    Divider: () => <hr />,
    Heading: ({ children }) => <h2>{children}</h2>,
    Link: ({ children, as: Component, ...props }) => {
      if (Component) {
        return <Component {...props}>{children}</Component>;
      }
      return <a {...props}>{children}</a>;
    },
    useToast: () => mockToast,
  };
});

Object.defineProperty(window, 'location', {
  configurable: true,
  value: { reload: jest.fn() },
});

// ======================= TEST SUITE =======================

describe('Login Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nhập tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nhập mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByText(/chưa có tài khoản?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /đăng ký ngay/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockUser = { username: 'testuser', id: 1 };
    const mockResponse = { accessToken: 'fake-jwt-token', user: mockUser };
    apiService.post.mockImplementation((url, data, callback) => callback(mockResponse, true));

    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/nhập tên đăng nhập/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/nhập mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(authService.setAuthData).toHaveBeenCalledWith(mockResponse.accessToken, mockResponse.user);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles failed login with error message from server', async () => {
    const mockErrorResponse = { message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    apiService.post.mockImplementation((url, data, callback) => callback(mockErrorResponse, false));

    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/nhập tên đăng nhập/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText(/nhập mật khẩu/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
      expect(authService.setAuthData).not.toHaveBeenCalled();
    });
  });

  test('handles network/connection error when api call throws', async () => {
    apiService.post.mockImplementation(() => { throw new Error('Network Error'); });

    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/nhập tên đăng nhập/i), { target: { value: 'anyuser' } });
    fireEvent.change(screen.getByPlaceholderText(/nhập mật khẩu/i), { target: { value: 'anypass' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Lỗi kết nối" }));
    });
  });
});