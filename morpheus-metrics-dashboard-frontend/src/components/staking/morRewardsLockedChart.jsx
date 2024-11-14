import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, subDays, isAfter } from 'date-fns';
import { formatNumber, ToggleButtonGroup } from '../utils/utils';

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
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '3px 0', color: entry.color }}>
                            {`${entry.name}: ${formatNumber(entry.value)} MOR`}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const MorRewardsLockedChart = ({ data }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [chartData, setChartData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);
    const [timeRange, setTimeRange] = useState('All Time');
    const scrollRef = useRef(null);

    const timeRangeOptions = [
        { key: '30D', value: '30D' },
        { key: 'All Time', value: 'All Time' }
    ];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (data) {
            const processedData = Object.entries(data).map(([date, values]) => ({
                date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
                dateObj: parse(date, 'dd/MM/yyyy', new Date()),
                combined: values.total,
                capital: values.capital,
                code: values.code
            })).sort((a, b) => a.dateObj - b.dateObj);

            setChartData(processedData);
        }
    }, [data]);

    useEffect(() => {
        if (chartData.length > 0) {
            const filterData = () => {
                if (timeRange === '30D') {
                    const thirtyDaysAgo = subDays(new Date(), 32);
                    return chartData.filter(item => isAfter(item.dateObj, thirtyDaysAgo));
                }
                return chartData;
            };
            setFilteredChartData(filterData());
        }
    }, [chartData, timeRange]);

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className="chart-container">
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                position: 'relative'
            }}>
                <div style={{ flex: 1 }}>
                    <h2 className="chartheading" style={{ textAlign: 'center' }}>
                        MOR Rewards Staked Over Time
                    </h2>
                </div>
            </div>
            <p className="chart-note">Visualization of MOR Rewards Staked Over Time</p>
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={timeRangeOptions}
                    selectedOption={timeRangeOptions.find(opt => opt.key === timeRange)}
                    setSelectedOption={(option) => setTimeRange(option.key)}
                />
            </div>
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
                                interval={isMobile ? 'preserveStartEnd' : timeRange === 'All Time' ? 30 : 0}
                            />
                            <YAxis
                                tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                            >
                                {!isMobile && 
                                    <Label 
                                        value="MOR Amount"
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
                            <Legend 
                                verticalAlign={isMobile ? "bottom" : "top"}
                                height={36}
                                iconSize={isMobile ? 8 : 14}
                                wrapperStyle={isMobile ? { fontSize: '10px' } : {}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="combined"
                                name="Combined Rewards"
                                stroke="#8884d8" 
                                dot={false}
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }}
                                legendType='diamond'
                            />
                            <Line 
                                type="monotone" 
                                dataKey="capital"
                                name="Capital Rewards"
                                stroke="#23DC8E" 
                                dot={false}
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }}
                                legendType='diamond'
                            />
                            <Line 
                                type="monotone" 
                                dataKey="code"
                                name="Code Rewards"
                                stroke="#3372f9" 
                                dot={false}
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }}
                                legendType='diamond'
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MorRewardsLockedChart;