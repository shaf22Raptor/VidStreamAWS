import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const confirmEndpoint = `${apiBaseUrl}/auth/confirm-register`;

// Reusable Input Field Component
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

// Registration Service Function (for making the request to AWS Cognito)
async function confirmUser(email, code) {
    const requestBody = {
        email: email,
        confirmationCode: code
    };
    console.log(requestBody);
    const response = await fetch(confirmEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });
    console.log("Entered registerUser function");

    return response.json();
}

// Main Registration Form Component
function ConfirmForm() {
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();
    const { email } = location.state || {};
    console.log("email is", email);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);

        try {
            const response = await confirmUser(email, code);
            const data = JSON.parse(response.body);
            console.log(response);

            if (!data.error) {
                alert('Your account has been confirmed! successful!');
                navigate('/'); // Redirect to home page after success
            } else {
                setError(data.message || 'An error has occured');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <InputField
                label="Register Code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
            />
            
            <button className='register-button' type="submit">Confirm</button>

            {error && <ErrorMessage message={error} />}
            <Link to='/'>
                <button className='home-button'>
                    Main menu
                </button>
            </Link>
        </form>
    );
}

// Register Page Component
export default function RegisterPage() {
    return (
        <div className='register-page'>
            <h2>Confirm your Account</h2>
            <ConfirmForm/>
        </div>
    );
}
