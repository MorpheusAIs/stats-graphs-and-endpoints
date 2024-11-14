import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, subDays } from 'date-fns';
import { formatNumber } from '../utils/utils';
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

const CustomTooltip = ({ active, payload, label, isMobile }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ 
                backgroundColor: '#000000', 
                color: '#01FF85', 
                padding: isMobile ? '5px' : '10px', 
                borderRadius: '5px', 
                border: "2px solid #494949",
                fontSize: isMobile ? '10px' : '12px'
            }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>
                        {`Daily Emission: ${formatNumber(payload[0].value.toFixed(2))} MOR`}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const MorEmissionsChart = () => {
    const [chartData, setChartData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);
    const [timeRange, setTimeRange] = useState('All Time');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/total_and_circ_supply`);
                const data = await response.json();

                const processedData = data.data.map(item => ({
                    date: format(parse(item.date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
                    dateObj: parse(item.date, 'dd/MM/yyyy', new Date()),
                    totalEmission: parseFloat(item.total_emission) || 0
                })).sort((a, b) => a.dateObj - b.dateObj);

                setChartData(processedData);
                setFilteredChartData(processedData); // Initialize with all data
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (chartData.length > 0) {
            if (timeRange === '30D') {
                const thirtyDaysAgo = subDays(new Date(), 32);
                setFilteredChartData(chartData.filter(item => item.dateObj >= thirtyDaysAgo));
            } else {
                setFilteredChartData(chartData);
            }
        }
    }, [chartData, timeRange]);

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className="chart-container">
            <h2 className="chartheading">Daily MOR Emissions</h2>
            <div className="toggle-container">
                <div className="toggle-group">
                    <button 
                        className={`toggle-button ${timeRange === '30D' ? 'active' : ''}`}
                        onClick={() => setTimeRange('30D')}
                    >
                        30D
                    </button>
                    <button 
                        className={`toggle-button ${timeRange === 'All Time' ? 'active' : ''}`}
                        onClick={() => setTimeRange('All Time')}
                    >
                        All Time
                    </button>
                </div>
            </div>
            <p className="chart-note">Visualization of Daily MOR emissions over time</p>
            <div className="chart-wrapper" ref={scrollRef}>
                <div style={{ width: chartWidth, height: chartHeight }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={filteredChartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: isMobile ? 20 : 60,
                                bottom: isMobile ? 20 : 30,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                angle={-45}
                                textAnchor="end"
                                height={isMobile ? 60 : 70}
                                interval={Math.ceil(filteredChartData.length / 8)}
                            />
                            <YAxis
                                tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                domain={[0, 26000]}
                            >
                                {!isMobile && 
                                    <Label 
                                        value="Daily Emission (MOR)"
                                        angle={-90} 
                                        position="insideLeft"
                                        offset={-45}
                                        style={{ 
                                            fill: '#FFFFFF', 
                                            fontWeight: 'bold', 
                                            textAnchor: 'middle'
                                        }} 
                                    />
                                }
                            </YAxis>
                            <Tooltip content={<CustomTooltip isMobile={isMobile} />} />
                            <Line 
                                type="monotone" 
                                dataKey="totalEmission"
                                name="Daily Emission"
                                stroke="#8884d8" 
                                dot={false}
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MorEmissionsChart;