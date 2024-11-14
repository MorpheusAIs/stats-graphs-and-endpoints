import React, { useState, useEffect } from 'react';
import { DataCard, formatNumberWithOutDecimal } from '../utils/utils';
import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css";

const base_api_url = api_url.base_api_url;

function CodeMetricsView() {
    const [metricsData, setMetricsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/code_metrics`);
                const data = await response.json();
                setMetricsData(data);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    return (
        <div className="staking_reward_main_grid">
            <div className="staking_reward_main_flex">
                <DataCard
                    title="Number of Active Code Contributors"
                    value={formatNumberWithOutDecimal(metricsData?.active_contributors || 0)}
                    subcontent={null}
                />
            </div>
            <div className="staking_reward_main_flex">
                <DataCard
                    title="Number of Total Code Contributors"
                    value={formatNumberWithOutDecimal(metricsData?.unique_contributors || 0)}
                    subcontent={null}
                />
            </div>
        </div>
    );
}

export default CodeMetricsView;