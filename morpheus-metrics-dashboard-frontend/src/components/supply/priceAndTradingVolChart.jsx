import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label } from 'recharts';
import { format, parse, subDays, isAfter } from 'date-fns';
import "./../../css/supply/supplyView.css";

// Assuming these are defined in your utils file
import { formatNumber, formatNumberWithOutDecimal, ToggleButtonGroup } from '../utils/utils';

// Assuming this is defined in your config file
import api_url from "./../../config/api_url.json";
const base_api_url = api_url.base_api_url;

const eventDates = [
  { date: '08/05', event: 'MOR Token Launch' },
  { date: '25/07', event: 'Capital Rewards Staking Introduced' },
  { date: '09/08', event: 'Code Rewards Staking Introduced' },
  { date: '24/09', event: 'Capital Rewards 90-day Delay Introduced' }
];

const processData = (data) => {
    const prices = data.prices.map(([date, price]) => {
        const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
        const formattedDate = format(parsedDate, 'MMM d, yyyy');
        const monthDay = format(parsedDate, 'dd/MM');
        const isEventDate = eventDates.some(event => event.date === monthDay);
        const event = eventDates.find(event => event.date === monthDay)?.event;

        // if (isEventDate) {
        //     console.log(`Event date found: ${formattedDate}, Event: ${event}`);
        // }

        return {
            date: formattedDate,
            dateObj: parsedDate,
            price: price,
            isEventDate,
            event
        };
    });

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

const CustomTooltip = ({ active, payload, label, isMobile }) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
            <div style={{ 
                backgroundColor: '#000000', 
                color: '#01FF85', 
                padding: isMobile ? '5px' : '10px', 
                borderRadius: '5px', 
                border: "2px solid #494949",
                fontSize: isMobile ? '10px' : '12px'
            }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Date: {label}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>Price: ${formatNumber(payload[0].value.toFixed(4))}</p>
                    <p style={{ margin: '3px 0' }}>Volume: ${formatNumber(payload[1].value.toFixed(2))}</p>
                    {dataPoint.isEventDate && <p style={{ margin: '3px 0', color: '#01FF85' }}>Event: {dataPoint.event}</p>}
                </div>
            </div>
        );
    }
    return null;
};

const PriceVolumeChart = () => {
    const [chartData, setChartData] = useState(null);
    const [filteredChartData, setFilteredChartData] = useState(null);
    const [timeRange, setTimeRange] = useState('All Time');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

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
                    return chartData.filter(item => isAfter(item.dateObj, thirtyDaysAgo));
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

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className={`price-volume-chart-container ${isMobile ? 'mobile' : ''}`}>
            <div className="price-volume-chart-content">
                <h2 className="chartheading">Historical Price & Volume Chart</h2>
                <div className="toggle-container price-volume-toggle">
                    <ToggleButtonGroup
                        options={timeRangeOptions}
                        selectedOption={timeRangeOptions.find(option => option.key === timeRange)}
                        setSelectedOption={(option) => setTimeRange(option.key)}
                    />
                </div>
                <p className="chart-note">Note: The right Y-axis represents Volume</p>
                <div className="chart-wrapper" ref={scrollRef}>
                    <div style={{ width: chartWidth, height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
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
                                    angle={isMobile ? -45 : -45}
                                    textAnchor="end"
                                    height={isMobile ? 60 : 70}
                                    interval={isMobile ? 'preserveStartEnd' : timeRange === 'All Time' ? 30 : 0}
                                >
                                    {!isMobile && <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />}
                                </XAxis>
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                    domain={['auto', 'auto']}
                                >
                                    {!isMobile && <Label value="Price ($)" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />}
                                </YAxis>
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => isMobile ? formatNumberWithOutDecimal(value / 1000) + 'K' : formatNumberWithOutDecimal(value)}
                                />
                                <Tooltip content={<CustomTooltip isMobile={isMobile} />} />
                                <Legend 
                                    verticalAlign={isMobile ? "bottom" : "top"} 
                                    height={36}
                                    iconSize={isMobile ? 8 : 14}
                                    wrapperStyle={isMobile ? { fontSize: '10px' } : {}}
                                />
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#8884d8" 
                                    name="Price" 
                                    legendType='diamond'
                                    dot={(props) => {
                                        const { cx, cy, payload } = props;
                                        if (payload.isEventDate) {
                                            return (
                                                <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke="#514f7f" strokeWidth={2} />
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                yAxisId="right" 
                                dataKey="volume" 
                                fill="#82ca9d" 
                                name="Volume" 
                                opacity={0.5}
                                legendType='diamond' />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceVolumeChart;