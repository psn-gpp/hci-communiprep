import React from 'react';
import { Alert } from 'react-bootstrap';

const CustomAlert = ({ alertVisible, setAlertVisible, alertMessage, variant = 'danger' }) => {
    if (!alertVisible) return null;

    return (
        <Alert variant={variant} dismissible onClose={() => setAlertVisible(false)}>
            <ul>
                {alertMessage.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </Alert>
    );
};

export default CustomAlert;
