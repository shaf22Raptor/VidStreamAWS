import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const loginEndpoint = `${apiBaseUrl}/auth/login`;

// Reusable Input Field Component for email and password
function InputField({ label, type, value, onChange }) {
    return (
        <div>
            <label>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required
            />
        </div>
    );
}

// Reusable Error Message Component
function ErrorMessage({ message }) {
    return (
        <p style={{ color: 'red' }}>{message}</p>
    );
}

// Login Service Function (for making the request)
async function loginUser(email, password) {
    const requestBody = {
        email,
        password,
    };

    const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    return response.json();
}

// Main Login Form Component logic
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            navigate('/'); // Redirect to homepage if already logged in
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
    
        try {
            const response = await loginUser(email, password);
            const data = JSON.parse(response.body);
    
            if (data.accessToken) {
                // Login successful, store the tokens and the email
                sessionStorage.setItem('accessToken', data.accessToken);
                sessionStorage.setItem('idToken', data.idToken);
                sessionStorage.setItem('refreshToken', data.refreshToken);
                sessionStorage.setItem('email', email);  // Store the correct email after login
    
                alert('Login successful!');
                navigate('/'); // Redirect to home after login
            } else {
                // Handle error message
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <InputField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className='login-button' type="submit">Submit</button>

            {error && <ErrorMessage message={error} />}
            <Link to='/'>
                <button className='home-button'>
                    Main menu
                </button>
            </Link>
        </form>
    );
}

// Login Page Component
export default function LoginPage() {
    return (
        <div className='login-page'>
            <h2>Login</h2>
            <LoginForm />
        </div>
    );
}