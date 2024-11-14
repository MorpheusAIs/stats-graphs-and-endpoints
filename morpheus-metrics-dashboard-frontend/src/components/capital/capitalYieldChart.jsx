import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, subDays, isAfter } from 'date-fns';
import { formatNumber, ToggleButtonGroup } from '../utils/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CustomTooltip = ({ active, payload, label, isMobile, showUSD }) => {
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
                        {`Yield Claimed: ${showUSD ? '$' : ''}${formatNumber(payload[0].payload.dailyYield.toFixed(2))}${showUSD ? '' : ' stETH'}`}
                    </p>
                    <p style={{ margin: '3px 0' }}>
                        {`Total Yield: ${showUSD ? '$' : ''}${formatNumber(payload[0].payload.cumulativeYield.toFixed(2))}${showUSD ? '' : ' stETH'}`}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CapitalYieldChart = ({ data, stEthPrice = 0 }) => {
    const [timeRange, setTimeRange] = useState('All Time');
    const [chartData, setChartData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showUSD, setShowUSD] = useState(false);
    const scrollRef = useRef(null);

    const timeRangeOptions = [
        { key: '30D', value: '30D' },
        { key: 'All Time', value: 'All Time' }
    ];

    const processData = (showUSDValue) => {
        try {
            if (!data || !data.bridged_overplus_amount_by_date) return [];

            const processedData = Object.entries(data.bridged_overplus_amount_by_date).map(([date, values]) => {
                const multiplier = showUSDValue ? stEthPrice : 1;
                return {
                    date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
                    dateObj: parse(date, 'dd/MM/yyyy', new Date()),
                    cumulativeYield: values.Cumulative_Bridged * multiplier,
                    dailyYield: values.Daily_Bridged * multiplier
                };
            });

            processedData.sort((a, b) => a.dateObj - b.dateObj);
            return processedData;
        } catch (error) {
            console.error('Error processing data:', error);
            setError(error.message);
            return [];
        }
    };

    useEffect(() => {
        const newChartData = processData(showUSD);
        setChartData(newChartData);
        setIsLoading(false);
    }, [data, showUSD, stEthPrice]);

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
                flexDirection: 'column',
                alignItems: 'center', 
                marginBottom: '20px',
                position: 'relative'
            }}>
                <h2 className="chartheading" style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : 0 }}>
                    Yield Generated by Capital Providers
                </h2>
                {!isMobile ? (
                    // Desktop version - keep the button on the right
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <div 
                            onClick={() => setShowUSD(!showUSD)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: 'rgba(1, 255, 133, 0.1)',
                                border: '1px solid #01FF85',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                marginLeft: '8px'
                            }}
                            className="hover:bg-[#01FF85] hover:bg-opacity-20"
                        >
                            {showUSD ? (
                                <FontAwesomeIcon 
                                    icon="fa-solid fa-dollar-sign" 
                                    style={{ color: '#01FF85', fontSize: '16px' }}
                                    fixedWidth
                                />
                            ) : (
                                <FontAwesomeIcon 
                                    icon="fa-brands fa-ethereum" 
                                    style={{ color: '#01FF85', fontSize: '16px' }}
                                    fixedWidth
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    // Mobile version - button below heading
                    <div 
                        onClick={() => setShowUSD(!showUSD)}
                        style={{
                            cursor: 'pointer',
                            backgroundColor: 'rgba(1, 255, 133, 0.1)',
                            border: '1px solid #01FF85',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            marginTop: '8px'
                        }}
                        className="hover:bg-[#01FF85] hover:bg-opacity-20"
                    >
                        {showUSD ? (
                            <FontAwesomeIcon 
                                icon="fa-solid fa-dollar-sign" 
                                style={{ color: '#01FF85', fontSize: '16px' }}
                                fixedWidth
                            />
                        ) : (
                            <FontAwesomeIcon 
                                icon="fa-brands fa-ethereum" 
                                style={{ color: '#01FF85', fontSize: '16px' }}
                                fixedWidth
                            />
                        )}
                    </div>
                )}
            </div>
            <p className="chart-note">
                Visualization of Total Yield Generated By Capital Providers in {showUSD ? 'USD' : 'stETH'}
            </p>
            {/* Rest of the component stays the same */}
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={timeRangeOptions}
                    selectedOption={timeRangeOptions.find(opt => opt.key === timeRange)}
                    setSelectedOption={(option) => setTimeRange(option.key)}
                />
            </div>
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
    // Remove the interval condition to show all dates
    interval={timeRange === 'All Time' ? Math.floor(filteredChartData.length / 8) : 0}
/>
<YAxis
    tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
    domain={[0, 2750]}
    ticks={[0, 700, 1400, 2100, 2800]} // Specify exact tick values
>
    {!isMobile && 
        <Label 
            value={`Amount (${showUSD ? 'USD' : 'stETH'})`}
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
                            <Tooltip content={<CustomTooltip isMobile={isMobile} showUSD={showUSD} />} />
                            <Legend 
                                verticalAlign={isMobile ? "bottom" : "top"}
                                height={36}
                                iconSize={isMobile ? 8 : 14}
                                wrapperStyle={isMobile ? { fontSize: '10px' } : {}}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="cumulativeYield"
                                name="Generated Yield"
                                stroke="#8884d8" 
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

export default CapitalYieldChart;