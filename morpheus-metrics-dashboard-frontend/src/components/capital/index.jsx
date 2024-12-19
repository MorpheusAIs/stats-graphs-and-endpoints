import React, { useState, useEffect } from 'react';
import CapitalStakedAmountsChart from './capitalStakedAmountsChart';
import CurrentCapitalChart from './currentCapitalChart';
import CapitalProvidersChart from './capitalProvidersChart';
import CapitalYieldChart from './capitalYieldChart';
import CapitalRewardsChart from './capitalRewardsChart';
import api_url from "./../../config/api_url.json";
import "./../../css/capital/capitalView.css";

const base_api_url = api_url.base_api_url;

function CapitalView() {
    const [capitalData, setCapitalData] = useState(null);
    const [stEthPrice, setStEthPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both endpoints concurrently
                const [metricsResponse, priceResponse] = await Promise.all([
                    fetch(`${base_api_url}/capital_metrics`),
                    fetch(`${base_api_url}/analyze-mor-stakers`)
                ]);

                if (!metricsResponse.ok || !priceResponse.ok) {
                    throw new Error('One or more network requests failed');
                }

                const [metricsData, priceData] = await Promise.all([
                    metricsResponse.json(),
                    priceResponse.json()
                ]);

                setCapitalData(metricsData);
                setStEthPrice(priceData?.staker_analysis?.prices?.stETH || 0);
                setIsLoading(false);
            } catch (error) {
                console.error('Fetch error:', error);
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return (
        <div style={{ 
            color: '#FFFFFF', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px' 
        }}>
            Loading...
        </div>
    );

    if (error) return (
        <div style={{ 
            color: '#FF0000', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px' 
        }}>
            Error: {error}
        </div>
    );

    return (
        <div className="capital-view-container">
            <CapitalProvidersChart data={capitalData} />
            <div className="charts-row">
                <div className="chart-col">
                    <CapitalStakedAmountsChart 
                        data={capitalData} 
                        stEthPrice={stEthPrice}
                    />
                </div>
                <div className="chart-col">
                    <CurrentCapitalChart 
                        data={capitalData} 
                        stEthPrice={stEthPrice}
                    />
                </div>
            </div>
            <div className="charts-row">
                <div className="chart-col">
                    <CapitalYieldChart 
                        data={capitalData} 
                        stEthPrice={stEthPrice}
                    />
                </div>
                <div className="chart-col">
                    <CapitalRewardsChart 
                        data={capitalData}
                        stEthPrice={stEthPrice}
                    />
                </div>
            </div>
        </div>
    );
}

export default CapitalView;