import React, { useState, useEffect } from 'react';
import SupplyChart from './supplyChart';
import PriceVolumeChart from './priceAndTradingVolChart';
import CirTotalMCapLPView from './cirTotalMCapLPView';
import MorLockedAndBurnedChart from './morLockedAndBurnedChart';
import MORHoldersDistribution from './morHoldersDistribution';
import MorEmissionsChart from './morEmissionsChart';
import ProtocolLiquidityChart from './protocolLiquidityChart';
import "./../../css/supply/supplyView.css";
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

function SupplyView() {
    const [marketCapData, setMarketCapData] = useState(null);
    const [positionData, setPositionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/get_market_cap`);
                const data = await response.json();

                const response_1 = await fetch(`${base_api_url}/protocol_liquidity`);
                const data_1 = await response_1.json();

                setMarketCapData(data);
                setPositionData(data_1);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    return (
        <div className="supply-view-container">
            <div>
                <PriceVolumeChart />
            </div>
            <div className="chart-container">
                <h2 className="chartheading">Historical Total {'&'} Circulating Supply Chart</h2>
                <SupplyChart />
            </div>
            <CirTotalMCapLPView marketCapData={marketCapData} positionData={positionData} />
            <div className="charts-container">
                {/* Flexbox wrapper for both MorEmissionsChart and MorLockedAndBurnedChart */}
                <div className="side-by-side-charts">
                    <MorLockedAndBurnedChart />
                    <ProtocolLiquidityChart data={positionData} />
                </div>
            </div>
            <div className="charts-container">
                <div className="chart-item">
                    <MORHoldersDistribution />
                </div>
                <div className="chart-item">
                <MorEmissionsChart />
                </div>
            </div>
        </div>
    );
}

export default SupplyView;
