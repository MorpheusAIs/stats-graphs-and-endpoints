import React, { useState, useEffect } from 'react';
import StakingHistogramChart from './stakingDistributionChart';
import PowerMultiplierDistributionChart from './powerMultiplierDistributionChart';
import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css";

const base_api_url = api_url.base_api_url;

const StakingChart = () => {
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/get_stake_info`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setChartData(data);
                setIsLoading(false);
            } catch (e) {
                setError(e.message);
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
        <div className="charts-container">
            <div className="chart-item">
                    {chartData && <StakingHistogramChart data={chartData.stake_time} />}
            </div>
            <div className="chart-item">
                    {chartData && <PowerMultiplierDistributionChart data={chartData.power_multiplier} />}
            </div>
        </div>
    );
};

export default StakingChart;