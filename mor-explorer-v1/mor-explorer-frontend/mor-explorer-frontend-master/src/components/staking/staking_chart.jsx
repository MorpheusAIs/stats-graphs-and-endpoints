import React, { useState, useEffect } from 'react';
import StakingHistogramChart from './stakingDistributionChart';
import PowerMultiplierDistributionChart from './powerMultiplierDistributionChart';

import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css"


const base_api_url = api_url.base_api_url;

const StakingChart = () => {
    const [chartData, setChartData] = useState([]);
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
                console.error("An error occurred while fetching the data: ", e);
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
        <>
            <div className="staking_chart_background">
                <h2 className="chartheading">
                    Stake Time Distribution For Stakers
                </h2>
                <StakingHistogramChart data={chartData.stake_time} />
            </div>
            <br />
            <br />
            <div className="staking_chart_background">
                <h2 className="chartheading">
                    Power Multiplier Distribution For Stakers
                </h2>
                <PowerMultiplierDistributionChart data={chartData.power_multiplier} />
            </div>
        </>
    );
};

export default StakingChart;