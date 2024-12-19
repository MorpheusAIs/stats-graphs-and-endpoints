import React, { useState, useEffect } from 'react';
import './../../css/navbar/main_navbar.css';
import morlogo from './../../assets/morlogo.jpg';
import { Menu } from 'lucide-react'; // Import the Menu icon from lucide-react
import api_url from './../../config/api_url.json'; // Import the API URL configuration

const MainNavbar = () => {
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const base_api_url = api_url.base_api_url;

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toUTCString().replace(/GMT$/, "UTC");
    };

    useEffect(() => {
        const fetchLastUpdateTime = async () => {
            try {
                const response = await fetch(`${base_api_url}/last_cache_update_time`);
                const data = await response.json();
                if (data && data.last_updated_time) {
                    setLastUpdateTime(data.last_updated_time);
                }
            } catch (error) {
                console.error("Error fetching last update time:", error);
            }
        };

        fetchLastUpdateTime();
        const timer = setInterval(fetchLastUpdateTime, 43200000); // Update every 12 hours (43,200,000 ms)

        return () => clearInterval(timer);
    }, [base_api_url]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <a href="https://mor.org">
                    <img src={morlogo} alt="Logo" className="logo" />
                </a>
            </div>
            <div className="hamburger-menu" onClick={toggleMenu}>
                <Menu size={24} color="#FFFFFF" />
            </div>
            <div className={`navbar-center ${isMenuOpen ? 'active' : ''}`}>
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
                        <a href="https://github.com/MorpheusAIs/Docs" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">Docs</span>
                        </a>
                    </li>
                    {/* <li>
                        <a href="https://testing-2nm.pages.dev/" target="_blank" rel="noopener noreferrer">
                            <span className="font-thin ml-4" id="labels">Claim Rewards</span>
                        </a>
                    </li> */}
                </ul>
            </div>
            <div className="last-update-card">
                <div className="last-update-label">Last Updated:</div>
                <div className="last-update-time">
                    {lastUpdateTime ? formatTime(lastUpdateTime) : "Fetching..."}
                </div>
            </div>
        </nav>
    );
};

export default MainNavbar;
