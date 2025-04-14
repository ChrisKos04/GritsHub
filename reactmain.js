// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserDashboardPage from './pages/UserDashboardPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import FoodListingPage from './pages/FoodListingPage';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/common/PrivateRoute';
import Alert from './components/common/Alert';

import AuthState from './context/auth/AuthState';
import FoodState from './context/food/FoodState';
import setAuthToken from './utils/setAuthToken';

import './App.css';

// Check for token in localStorage
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  return (
    <AuthState>
      <FoodState>
        <Router>
          <div className="app">
            <Navbar />
            <Alert />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard/user" 
                  element={
                    <PrivateRoute role="recipient">
                      <UserDashboardPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/dashboard/business" 
                  element={
                    <PrivateRoute role="business">
                      <BusinessDashboardPage />
                    </PrivateRoute>
                  } 
                />
                <Route path="/food" element={<FoodListingPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </FoodState>
    </AuthState>
  );
};

export default App;

// src/components/layout/Navbar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Navbar = () => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, logout, user } = authContext;

  const onLogout = () => {
    logout();
  };

  const authLinks = (
    <ul>
      <li>
        <Link to={user && user.role === 'business' ? '/dashboard/business' : '/dashboard/user'}>
          Dashboard
        </Link>
      </li>
      <li>
        <Link to="/food">Food Listings</Link>
      </li>
      <li>
        <a onClick={onLogout} href="#!">
          <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul>
      <li>
        <Link to="/food">Browse Food</Link>
      </li>
      <li>
        <Link to="/about">About</Link>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
      <li>
        <Link to="/login">Login</Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar">
      <h1>
        <Link to="/">
          <i className="fas fa-seedling"></i> FoodShare
        </Link>
      </h1>
      <div>{isAuthenticated ? authLinks : guestLinks}</div>
    </nav>
  );
};

export default Navbar;

// src/components/auth/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';

const Login = () => {
  const authContext = useContext(AuthContext);
  const { login, error, clearErrors, isAuthenticated, user } = authContext;
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated) {
      if (user && user.role === 'business') {
        navigate('/dashboard/business');
      } else {
        navigate('/dashboard/user');
      }
    }
  }, [isAuthenticated, navigate, user]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'recipient' // Default to recipient
  });

  const { email, password, role } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: