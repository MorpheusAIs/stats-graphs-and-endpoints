import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SupplyView from './supply';
import StakingView from './staking';
import "./../css/main.css";

function MainApp({ walletAddress, isWalletConnected }) {
    return (
        <main id="main" className='main'>

            <Routes>
                <Route path="/supply" element={
                    <>
                        <SupplyView />
                    </>
                } />

                <Route path="/staking" element={
                    <>
                        <StakingView />
                    </>
                } />

                <Route path="/" element={<Navigate replace to="/supply" />} />
            </Routes>
        </main>
    );
}

export default MainApp;
