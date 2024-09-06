import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { formatNumber, formatNumberWithOutDecimal } from '../utils/utils';

import api_url from "./../../config/api_url.json"


const base_api_url = api_url.base_api_url

const processData = (data) => {
    return Object.entries(data.range_counts).map(([range, count]) => ({
        range,
        count
    }));
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Range: ${label}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Number of Holders: ${formatNumberWithOutDecimal(payload[0].value)}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const MORHoldersDistribution = () => {

    const [chartData, setChartData] = useState(null)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/mor_holders_by_range`);
                const data = await response.json();

                let process_data = processData(data);

                setChartData(process_data);
                setIsLoading(false);

            } catch (error) {
                console.error("Error fetching staking data:", error);
                setError(error.message);
                setIsLoading(false);
            }
        };
        fetchData()
    }, []);




    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    return (
        <div className="supply_chart_background">
            <br />
            <h2 className="chartheading">
                Number of MOR Holders by Range
            </h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis
                        dataKey="range"
                        tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    >
                        <Label value="MOR Holding Range" offset={-50} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />
                    </XAxis>
                    <YAxis
                        tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                        tickFormatter={(value) => formatNumberWithOutDecimal(value)}
                    >
                        <Label value="Number of Holders" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="count" fill="#8884d8" name="Number of Holders" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MORHoldersDistribution;