import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse } from 'date-fns';
import { formatNumberWithOutDecimal, formatNumber } from '../utils/utils';
import api_url from "./../../config/api_url.json"


const base_api_url = api_url.base_api_url

const processData = (data) => {
    return data.map(item => ({
        date: format(parse(item.date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(item.date, 'dd/MM/yyyy', new Date()),
        totalSupply: item.total_supply,
        circulatingSupply: item.circulating_supply
    })).sort((a, b) => a.dateObj - b.dateObj);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }} >
                    <p style={{ margin: '3px 0' }}>{`Total Supply: ${formatNumber(payload[0].value.toFixed(2))}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Circulating Supply: ${formatNumber(payload[1].value.toFixed(2))}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const SupplyChart = () => {

    const [chartData, setChartData] = useState(null)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/total_and_circ_supply`);
                const data = await response.json();

                let process_data = processData(data.data);

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
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                >
                    <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />
                </XAxis>
                <YAxis tick={{ fill: '#FFFFFF', fontSize: '10px' }} tickFormatter={(value) => formatNumberWithOutDecimal(value)}>
                    <Label value="Supply" angle={-90} offset={-13} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="totalSupply" stroke="#8884d8" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#8884d8" }} name="Total Supply" />
                <Line type="monotone" dataKey="circulatingSupply" stroke="#82ca9d" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#82ca9d" }} name="Circulating Supply" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SupplyChart;