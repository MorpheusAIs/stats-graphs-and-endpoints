import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label } from 'recharts';
import { format, parse } from 'date-fns';
import { ToggleButtonGroup, formatNumber, formatNumberWithOutDecimal } from '../utils/utils';
import "./../../css/supply/supplyView.css"

import api_url from "./../../config/api_url.json"

const base_api_url = api_url.base_api_url

const processData = (data) => {
    const prices = data.prices.map(([date, price]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        price: price
    }));

    const volumes = data.total_volumes.map(([date, volume]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        volume: volume
    }));

    return prices.map(priceItem => ({
        ...priceItem,
        volume: volumes.find(v => v.date === priceItem.date)?.volume || 0
    })).sort((a, b) => a.dateObj - b.dateObj);
};

const CustomTooltip = ({ active, payload, label, dataKey }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`${dataKey === 'price' ? 'Price' : 'Volume'}: ${dataKey === 'price' ? '$' : ''}${formatNumber(payload[0].value.toFixed(dataKey === 'price' ? 4 : 2))}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const PriceVolumeChart = () => {


    const [chartData, setChartData] = useState(null)
    const [selectedOption, setSelectedOption] = useState({ key: 'price', value: 'Price Chart' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/prices_and_trading_volume`);
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

    const options = [
        { key: 'price', value: 'Price Chart' },
        { key: 'volume', value: 'Volume Chart' }
    ];

    const dataKey = selectedOption.key;
    const yAxisLabel = dataKey === 'price' ? 'Price ($)' : 'Volume';



    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    const renderChart = () => {
        return (
            <ResponsiveContainer width="100%" height={400}>
                {dataKey === 'price' ? (
                    <LineChart data={chartData}>
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
                        <YAxis
                            tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                            domain={['auto', 'auto']}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} dot={{ r: 2 }} name="Price" />
                    </LineChart>
                ) : (
                    <BarChart data={chartData}>
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
                        <YAxis
                            tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => formatNumberWithOutDecimal(value)}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="volume" fill="#8884d8" name="Volume" />
                    </BarChart>
                )}
            </ResponsiveContainer>
        );
    };

    return (
        <div className="supply_chart_background">
            <div className="supply_main_flex">
                <ToggleButtonGroup
                    options={options}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                />
                <br />
                <h2 className="chartheading">
                    {selectedOption.value}
                </h2>
                {renderChart()}
            </div>
        </div>
    );
};

export default PriceVolumeChart;