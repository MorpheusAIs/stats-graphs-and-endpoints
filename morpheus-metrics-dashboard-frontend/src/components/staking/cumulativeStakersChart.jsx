import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, subDays, isAfter } from 'date-fns';

const processData = (dailyUniqueStakers) => {
    if (!dailyUniqueStakers || typeof dailyUniqueStakers !== 'object') {
        return [];
    }

    let cumulativeData = [];
    let cumulativePool0 = 0;
    let cumulativePool1 = 0;
    let cumulativeCombined = 0;

    Object.entries(dailyUniqueStakers).forEach(([date, data]) => {
        if (data && typeof data === 'object') {
            cumulativePool0 += data.pool_0 || 0;
            cumulativePool1 += data.pool_1 || 0;
            cumulativeCombined += data.combined || 0;

            const formattedDate = format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');

            cumulativeData.push({
                date: formattedDate,
                dateObj: new Date(date),
                capital: cumulativePool0,
                code: cumulativePool1,
                combined: cumulativeCombined
            });
        }
    });

    cumulativeData.sort((a, b) => a.dateObj - b.dateObj);

    return cumulativeData;
};

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
                <div style={{ color: 'white' }} >
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '3px 0' }}>{`${entry.name}: ${entry.value}`}</p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CumulativeStakersChart = ({ data }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [timeRange, setTimeRange] = useState('All Time');
    const [chartData, setChartData] = useState([]);
    const [filteredChartData, setFilteredChartData] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (data && data.daily_unique_stakers) {
            const processed = processData(data.daily_unique_stakers);
            setChartData(processed);
            setFilteredChartData(processed); // Initialize with all data
        }
    }, [data]);

    useEffect(() => {
        if (chartData.length > 0) {
            if (timeRange === '30D') {
                const thirtyDaysAgo = subDays(new Date(), 32);
                setFilteredChartData(chartData.filter(item => isAfter(item.dateObj, thirtyDaysAgo)));
            } else {
                setFilteredChartData(chartData);
            }
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

    if (!data || !data.daily_unique_stakers) {
        return <div>No data available for the chart</div>;
    }

    if (filteredChartData.length === 0) {
        return <div>No data available for the chart</div>;
    }

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className={`cumulative-stakers-chart-container ${isMobile ? 'mobile' : ''}`}>
            <div className="cumulative-stakers-chart-content">
                <h2 className="chartheading">Cumulative Stakers Over Time</h2>
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
                <div className="chart-wrapper" ref={scrollRef}>
                    <div style={{ width: chartWidth, height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={filteredChartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: isMobile ? 0 : 20,
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
                                >
                                    {!isMobile && <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />}
                                </XAxis>
                                <YAxis 
                                    tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                    tickFormatter={(value) => isMobile ? value / 1000 + 'K' : value}
                                >
                                    {!isMobile && <Label value="Cumulative Stakers" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />}
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
                                    dataKey="capital" 
                                    stroke="#8884d8" 
                                    activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                    dot={false} 
                                    name="Capital" 
                                    legendType='diamond'
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="code" 
                                    stroke="#82ca9d" 
                                    activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                    dot={false} 
                                    name="Code" 
                                    legendType='diamond'
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="combined" 
                                    stroke="#ffc658" 
                                    activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                    dot={false} 
                                    name="Combined" 
                                    legendType='diamond'
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CumulativeStakersChart;