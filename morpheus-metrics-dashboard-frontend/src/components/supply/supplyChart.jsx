import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, subDays } from 'date-fns';
import { formatNumberWithOutDecimal, formatNumber } from '../utils/utils';
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

const processData = (data, burntLockedData) => {
    const sortedData = data.map(item => ({
        date: format(parse(item.date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(item.date, 'dd/MM/yyyy', new Date()),
        totalSupply: parseFloat(item.total_supply) || 0,
        circulatingSupply: parseFloat(item.circulating_supply) || 0
    })).sort((a, b) => a.dateObj - b.dateObj);

    const latestData = sortedData[sortedData.length - 1];
    const totalBurnt = parseFloat(burntLockedData.burnt_mor.total_burnt_till_now) || 0;
    const totalLocked = parseFloat(burntLockedData.locked_mor.total_locked_till_now) || 0;
    const adjustedAmount = totalBurnt + totalLocked;

    latestData.adjustedTotalSupply = Math.max(0, latestData.totalSupply - adjustedAmount);
    latestData.adjustedCirculatingSupply = Math.max(0, latestData.circulatingSupply - adjustedAmount);

    return sortedData;
};

const CustomTooltip = ({ active, payload, label, isMobile }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const totalSupply = data.totalSupply;
        const circulatingSupply = data.circulatingSupply;
        const isLatestPoint = data.adjustedTotalSupply !== undefined;

        const formatValue = (value) => {
            if (typeof value !== 'number' || isNaN(value)) {
                return 'N/A';
            }
            return formatNumber(value.toFixed(2));
        };

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
                    {isLatestPoint ? (
                        <>
                            <p style={{ margin: '3px 0' }}>{`Burnt/Locked Adjusted TS: ${formatValue(data.adjustedTotalSupply)}`}</p>
                            <p style={{ margin: '3px 0' }}>{`Burnt/Locked Adjusted CS: ${formatValue(data.adjustedCirculatingSupply)}`}</p>
                            <p style={{ margin: '3px 0' }}>{`Total Supply: ${formatValue(totalSupply)}`}</p>
                            <p style={{ margin: '3px 0' }}>{`Circulating Supply: ${formatValue(circulatingSupply)}`}</p>
                        </>
                    ) : (
                        <>
                            <p style={{ margin: '3px 0' }}>{`Total Supply: ${formatValue(totalSupply)}`}</p>
                            <p style={{ margin: '3px 0' }}>{`Circulating Supply: ${formatValue(circulatingSupply)}`}</p>
                        </>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const SupplyChart = () => {
    const [chartData, setChartData] = useState(null);
    const [filteredChartData, setFilteredChartData] = useState(null);
    const [timeRange, setTimeRange] = useState('30D');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [supplyResponse, burntLockedResponse] = await Promise.all([
                    fetch(`${base_api_url}/total_and_circ_supply`),
                    fetch(`${base_api_url}/locked_and_burnt_mor`)
                ]);
                const supplyData = await supplyResponse.json();
                const burntLockedData = await burntLockedResponse.json();

                const processedData = processData(supplyData.data, burntLockedData);
                setChartData(processedData);
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

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className={`supply-chart-container ${isMobile ? 'mobile' : ''}`}>
            <div className="toggle-container supply-chart-toggle">
              <div className="toggle-group">
                    <button 
                       className={`toggle-button ${timeRange === '30D' ? 'active' : ''}`}
                       onClick={() => handleTimeRangeChange('30D')}
                       >
                          30D
                       </button>
                       <button 
                          className={`toggle-button ${timeRange === 'All Time' ? 'active' : ''}`}
                          onClick={() => handleTimeRangeChange('All Time')}
                        >
                        All Time
                    </button>
               </div>
            </div>
            <p class="chart-note">Visualisation of Daily Total Supply vs Circulating Supply for $MOR </p>
            <div className="chart-wrapper" ref={scrollRef}>
                <div style={{ width: chartWidth, height: chartHeight }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 300 : "100%"}>
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
                                interval={isMobile ? 'preserveStartEnd' : timeRange === 'All Time' ? 30 : 0}
                            >
                                {!isMobile && <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />}
                            </XAxis>
                            <YAxis 
                                tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }} 
                                tickFormatter={(value) => isMobile ? formatNumberWithOutDecimal(value / 1000) + 'K' : formatNumberWithOutDecimal(value)}
                            >
                                {!isMobile && <Label value="Supply" angle={-90} offset={-13} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />}
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
                            dataKey="totalSupply" 
                            stroke="#8884d8" 
                            activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                            dot={false} 
                            name="Total Supply" 
                            legendType='diamond'
                            />
            

                            <Line 
                            type="monotone" 
                            dataKey="circulatingSupply" 
                            stroke="#82ca9d" 
                            activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                            dot={false} 
                            name="Circulating Supply" 
                            legendType='diamond'
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SupplyChart;