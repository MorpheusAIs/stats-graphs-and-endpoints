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
                        <p key={index} style={{ margin: '3px 0' }}>
                            {`${entry.name}: ${formatNumber(entry.value)} providers`}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CapitalProvidersChart = ({ data }) => {
    const [timeRange, setTimeRange] = useState('All Time');
    const [chartData, setChartData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    const timeRangeOptions = [
        { key: '30D', value: '30D' },
        { key: 'All Time', value: 'All Time' }
    ];

    useEffect(() => {
        const processData = () => {
            try {
                if (!data) return;

                const dates = new Set([
                    ...Object.keys(data.number_of_total_capital_providers_by_date),
                    ...Object.keys(data.number_of_active_capital_providers_by_date)
                ]);

                const processedData = Array.from(dates).map(date => ({
                    date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
                    dateObj: parse(date, 'dd/MM/yyyy', new Date()),
                    "Total Capital Providers": data.number_of_total_capital_providers_by_date[date] || 0,
                    "Active Capital Providers": data.number_of_active_capital_providers_by_date[date] || 0
                }));

                processedData.sort((a, b) => a.dateObj - b.dateObj);
                setChartData(processedData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error processing data:', error);
                setError(error.message);
                setIsLoading(false);
            }
        };

        processData();

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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

    useEffect(() => {
        if (isMobile && scrollRef.current) {
            const scrollElement = scrollRef.current;
            let isScrolling = false;
            let startX;
            let scrollLeft;

            const handleTouchStart = (e) => {
                isScrolling = true;
                startX = e.touches[0].pageX - scrollElement.offsetLeft;
                scrollLeft = scrollElement.scrollLeft;
            };

            const handleTouchMove = (e) => {
                if (!isScrolling) return;
                e.preventDefault();
                const x = e.touches[0].pageX - scrollElement.offsetLeft;
                const walk = (x - startX) * 2;
                scrollElement.scrollLeft = scrollLeft - walk;
            };

            const handleTouchEnd = () => {
                isScrolling = false;
            };

            scrollElement.addEventListener('touchstart', handleTouchStart);
            scrollElement.addEventListener('touchmove', handleTouchMove);
            scrollElement.addEventListener('touchend', handleTouchEnd);

            return () => {
                scrollElement.removeEventListener('touchstart', handleTouchStart);
                scrollElement.removeEventListener('touchmove', handleTouchMove);
                scrollElement.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isMobile]);

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

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
                        Number of Active vs Total Capital Providers Over Time
                    </h2>
                </div>
            </div>
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={timeRangeOptions}
                    selectedOption={timeRangeOptions.find(opt => opt.key === timeRange)}
                    setSelectedOption={(option) => setTimeRange(option.key)}
                />
            </div>
            <p className="chart-note">
                Visualization of Active vs Total Capital Providers Over Time
            </p>
            <div className="chart-wrapper" ref={scrollRef}>
                <div style={{ width: chartWidth, height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
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
                                        value="Number of Providers"
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
                                dataKey="Total Capital Providers" 
                                stroke="#8884d8" 
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                dot={false} 
                                legendType='diamond'
                            />
                            <Line 
                                type="monotone" 
                                dataKey="Active Capital Providers" 
                                stroke="#82ca9d" 
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                dot={false} 
                                legendType='diamond'
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CapitalProvidersChart;