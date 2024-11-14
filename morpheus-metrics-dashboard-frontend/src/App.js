// App.js
import './App.css';
import MainNavbar from './components/navbar/main_navbar';
import SubNavbar from './components/navbar/sub_navbar';
import MainApp from './components/main_app';
import React from 'react';
import { FaDiscord, FaTwitter, FaGithub, FaTelegram } from 'react-icons/fa'; // Import FontAwesome icons

function App() {
  return (
    <>
      <div className="">
        <MainNavbar />
        <div className="main2">
          <SubNavbar />
          <MainApp />
        </div>
      </div>

      {/* Footer Component */}
      <footer className="footer">
        <div className="footer-content">
          <p>Have any suggestions? Join the Discord here:</p>
          <div className="social-icons">
            <a href="https://discord.gg/Dc26EFb6JK" target="_blank" rel="noopener noreferrer"><FaDiscord /></a>
            <a href="https://twitter.com/MorpheusAIs" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://t.me/MorpheusAI" target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
            <a href="https://github.com/MorpheusAIs" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
