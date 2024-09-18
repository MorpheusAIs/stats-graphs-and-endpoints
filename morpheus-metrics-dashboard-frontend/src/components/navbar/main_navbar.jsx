import React, { useState, useEffect } from 'react';
import './../../css/navbar/main_navbar.css'
import morlogo from './../../assets/morlogo.jpg';

const MainNavbar = () => {
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

    const formatTime = (date) => {
        return date.toUTCString().replace(/GMT$/, "UTC");
    };

    useEffect(() => {
        const updateTime = () => {
            setLastUpdateTime(new Date());
        };

        updateTime(); // Initial update
        const timer = setInterval(updateTime, 43200000); // Update every 12 hours (43,200,000 ms)

        return () => clearInterval(timer);
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <a href="/">
                    <img src={morlogo} alt="Logo" className="logo" />
                </a>
            </div>
            <div className="navbar-center">
                <ul className="navbar-links">
                    <li>
                        <a href="https://mor.org/about" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">About</span>
                        </a>
                    </li>
                    <li>
                        <a href="https://mor.org/ecosystem" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">Ecosystem</span>
                        </a>
                    </li>
                    <li>
                        <a href="https://mor.org/blog" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">Blogs</span>
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/MorpheusAIs/Docs/blob/main/Guides/Morpheus%20Capital%20Providers%20Contract%20Guide.md" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">Contract FAQ</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div className="last-update-card">
                <div className="last-update-label">Last Updated:</div>
                <div className="last-update-time">{formatTime(lastUpdateTime)}</div>
            </div>
        </nav>
    );
};

export default MainNavbar;