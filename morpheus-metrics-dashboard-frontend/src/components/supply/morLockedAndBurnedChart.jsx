import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse } from 'date-fns';
import { ToggleButtonGroup, formatNumber, formatNumberWithOutDecimal } from '../utils/utils';
import "./../../css/supply/supplyView.css"

import api_url from "./../../config/api_url.json"

const base_api_url = api_url.base_api_url

const processData = (data) => {
    const burnedData = Object.entries(data.burnt_mor.cumulative_mor_burnt).map(([date, value]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        burned: value,
        locked: data.locked_mor.cumulative_mor_locked[date]
    }));

    return burnedData.sort((a, b) => a.dateObj - b.dateObj);
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
                <div style={{ color: 'white' }}>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '3px 0' }}>
                            {`${entry.name}: ${formatNumber(entry.value.toFixed(2))} MOR`}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const MorLockedAndBurnedChart = () => {
    const [chartDataRaw, setChartDataRaw] = useState(null)
    const [chartData, setChartData] = useState(null)
    const [selectedOption, setSelectedOption] = useState({ key: 'burned', value: 'Burned MOR' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/locked_and_burnt_mor`);
                const data = await response.json();
                let process_data = processData(data);
                setChartDataRaw(data)
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

    const options = [
        { key: 'burned', value: 'Burned MOR' },
        { key: 'locked', value: 'Locked MOR' }
    ];

    const dataKey = selectedOption.key;
    const yAxisLabel = 'Cumulative MOR';

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    return (
        <div className={`mor-locked-burned-chart-container ${isMobile ? 'mobile' : ''}`}>
            <div className="mor-locked-burned-chart-content">
                <h2 className="chartheading">
                    {dataKey === 'burned' ? "Burned MOR Chart" : "Locked MOR Chart"}
                </h2>
                <div className="toggle-container mor-locked-burned-toggle">
                    <ToggleButtonGroup
                        options={options}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                    />
                </div>
                <div className="mt-4 text-white text-center">
                <p className="chart-note">Total {selectedOption.value} till now: {dataKey === 'burned' ? chartDataRaw.burnt_mor.total_burnt_till_now.toFixed(2) : chartDataRaw.locked_mor.total_locked_till_now.toFixed(2)} MOR</p>
                </div>
                <div className="chart-wrapper" ref={scrollRef}>
                    <div style={{ width: chartWidth, height: chartHeight }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
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
                                    interval={isMobile ? 'preserveStartEnd' : 0}
                                >
                                    {!isMobile && <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />}
                                </XAxis>
                                <YAxis
                                    tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => isMobile ? formatNumberWithOutDecimal(value / 1000) + 'K' : formatNumberWithOutDecimal(value)}
                                >
                                    {!isMobile && <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />}
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
                                dataKey={dataKey} 
                                stroke="#8884d8" 
                                activeDot={{ r: isMobile ? 4 : 8, fill: '#01FF85' }} 
                                dot={false} 
                                name={selectedOption.value} 
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

export default MorLockedAndBurnedChart;