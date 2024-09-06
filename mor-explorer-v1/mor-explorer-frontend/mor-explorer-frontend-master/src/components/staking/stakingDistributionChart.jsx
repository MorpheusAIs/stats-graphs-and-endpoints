import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Years Staked: ${label}`}</p>
                <div style={{ color: 'white' }} >
                    <p style={{ margin: '3px 0' }}>{`Number of Stakers: ${payload[0].value}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const StakingDistributionChart = ({ data }) => {

    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTimeout(() => {
            try {
                const processedData = data.ranges.map((range, index) => ({
                    range: range[1] === Infinity || range[1] === null ? `${range[0]}+` : `${range[0]}-${range[1]}`,
                    frequency: data.frequencies[index]
                }));

                setChartData(processedData);
                setIsLoading(false);
            } catch (e) {
                console.error("An error occurred while processing the data: ", e);
                setError(e.message);
                setIsLoading(false);
            }
        }, 10);
    }, [data.ranges, data.frequencies]);

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                    dataKey="range"
                    tick={{ fill: '#FFFFFF', fontSize: '12px' }}
                    interval={0}
                >
                    <Label value="Years Staked" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />
                </XAxis>
                <YAxis tick={{ fill: '#FFFFFF', fontSize: '12px' }}>
                    <Label value="Number of Stakers" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="frequency" fill="#8884d8" name="Number of Stakers" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default StakingDistributionChart;