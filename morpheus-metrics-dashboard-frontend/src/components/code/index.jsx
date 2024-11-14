import React, { useState, useEffect } from 'react';
import CodeMetricsView from './codeMetricsView';
import RepoCommitsChart from './repoCommitsChart';
import CodeRewardsChart from './ codeRewardsChart';
import api_url from "./../../config/api_url.json";
import "./../../css/code/codeView.css";

const base_api_url = api_url.base_api_url;

function CodeView() {
    const [codeMetricsData, setCodeMetricsData] = useState(null);
    const [capitalMetricsData, setCapitalMetricsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both endpoints concurrently
                const [codeResponse, capitalResponse] = await Promise.all([
                    fetch(`${base_api_url}/code_metrics`),
                    fetch(`${base_api_url}/capital_metrics`)
                ]);

                const [codeData, capitalData] = await Promise.all([
                    codeResponse.json(),
                    capitalResponse.json()
                ]);

                setCodeMetricsData(codeData);
                setCapitalMetricsData(capitalData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    return (
        <div className="code-view-container">
            <CodeMetricsView data={codeMetricsData} />
            <RepoCommitsChart />
            {capitalMetricsData && <CodeRewardsChart data={capitalMetricsData} />}
        </div>
    );
}

export default CodeView;