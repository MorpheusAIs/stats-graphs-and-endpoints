import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label } from 'recharts';
import { format, parse, subDays } from 'date-fns';
import { formatNumber, formatNumberWithOutDecimal } from '../utils/utils';
import { ToggleButtonGroup } from '../utils/utils';
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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Price: $${formatNumber(payload[0].value.toFixed(4))}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Volume: ${formatNumber(payload[1].value.toFixed(2))}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const PriceVolumeChart = () => {
    const [chartData, setChartData] = useState(null);
    const [filteredChartData, setFilteredChartData] = useState(null);
    const [timeRange, setTimeRange] = useState('30D');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/prices_and_trading_volume`);
                const data = await response.json();
                let process_data = processData(data);
                setChartData(process_data);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };
        fetchData()
    }, []);

    useEffect(() => {
        if (chartData) {
            const filterData = () => {
                if (timeRange === '30D') {
                    const thirtyDaysAgo = subDays(new Date(), 32);
                    return chartData.filter(item => item.dateObj >= thirtyDaysAgo);
                }
                return chartData;
            };
            setFilteredChartData(filterData());
        }
    }, [chartData, timeRange]);

    const timeRangeOptions = [
        { key: '30D', value: '30D' },
        { key: 'All Time', value: 'All Time' }
    ];

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    return (
        <div className="supply_chart_background">
            <div className="supply_main_flex">
                <h2 className="chartheading">Price and Volume Chart</h2>
                <div className="price-volume-toggle-container">
                    <ToggleButtonGroup
                        options={timeRangeOptions}
                        selectedOption={timeRangeOptions.find(option => option.key === timeRange)}
                        setSelectedOption={(option) => setTimeRange(option.key)}
                    />
                </div>
                <p className="chart-note">Note: The right Y-axis represents Volume</p>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={filteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 65 }}>
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
                            yAxisId="left"
                            tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                            domain={['auto', 'auto']}
                        >
                            <Label value="Price ($)" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                        </YAxis>
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => formatNumberWithOutDecimal(value)}
                        >
                            {/* <Label value="Volume" angle={90} position="insideRight" 
                            style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} /> */}

                        </YAxis>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Line yAxisId="left" type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
                        <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" name="Volume" opacity={0.5} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceVolumeChart;