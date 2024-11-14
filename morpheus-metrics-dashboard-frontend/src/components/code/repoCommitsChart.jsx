import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse, isAfter } from 'date-fns';
import { formatNumberWithOutDecimal, ToggleButtonGroup } from '../utils/utils';
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

const repoNameMapping = {
    'total': 'Total',
    'docs': 'Docs',
    'moragents': 'MORAgents',
    'mrc': 'MRC',
    'mor20': 'MOR20',
    'morpheus_lumerin_node': 'Morpheus Lumerin Node',
    'dashboard': 'Dashboard'
};

const processData = (data) => {
    if (!data) return [];
    
    const allDates = new Set();
    const repoData = {};
    
    // First, collect all dates from all repositories
    Object.keys(data).forEach(repo => {
        if (data[repo]) {
            Object.keys(data[repo]).forEach(date => {
                allDates.add(date);
            });
        }
    });

    // Convert dates to array and sort
    const sortedDates = Array.from(allDates).sort();

    // Process data for each date
    return sortedDates.map(date => {
        const dateObj = parse(date, 'dd/MM/yyyy', new Date());
        const formattedDate = format(dateObj, 'MMM d, yyyy');
        
        const dataPoint = {
            date: formattedDate,
            dateObj: dateObj,
        };

        // Add data for each repository
        Object.keys(data).forEach(repo => {
            if (data[repo] && data[repo][date]) {
                dataPoint[`${repo}_cumulative`] = data[repo][date].cumulative;
                dataPoint[`${repo}_daily`] = data[repo][date].daily;
            }
        });

        return dataPoint;
    });
};

const CustomTooltip = ({ active, payload, label, isMobile, selectedRepo }) => {
    if (active && payload && payload.length) {
        const repoName = selectedRepo === 'total' ? 'Total' : repoNameMapping[selectedRepo];
        const dailyKey = `${selectedRepo}_daily`;
        const cumulativeValue = payload[0]?.value;
        const dailyValue = payload[0]?.payload[dailyKey];

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
                    <p style={{ margin: '3px 0' }}>{`${repoName} Total Commits: ${formatNumberWithOutDecimal(cumulativeValue)}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Daily Commits: ${formatNumberWithOutDecimal(dailyValue)}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const RepoCommitsChart = () => {
    const [chartData, setChartData] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState('total');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const scrollRef = useRef(null);

    const repoOptions = [
        { key: 'total', value: 'Total' },
        { key: 'docs', value: 'Docs' },
        { key: 'moragents', value: 'MORAgents' },
        { key: 'mrc', value: 'MRC' },
        { key: 'mor20', value: 'MOR20' },
        { key: 'morpheus_lumerin_node', value: 'Morpheus Lumerin Node' },
        { key: 'dashboard', value: 'Dashboard' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/github_commits`);
                const data = await response.json();
                const processed = processData(data);
                setChartData(processed);
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

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    const chartHeight = isMobile ? 300 : 400;
    const chartWidth = isMobile ? '200%' : '100%';

    const calculateXAxisInterval = (dataLength) => {
        return Math.ceil(dataLength / 8);
    };

    return (
        <div className="chart-container">
            <h2 className="chartheading">Repository Commits Over Time</h2>
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={repoOptions}
                    selectedOption={repoOptions.find(opt => opt.key === selectedRepo)}
                    setSelectedOption={(option) => setSelectedRepo(option.key)}
                />
            </div>
            <p className="chart-note">
                Total Commits for {repoNameMapping[selectedRepo]}
            </p>
            <div className="chart-wrapper" ref={scrollRef}>
                <div style={{ width: chartWidth, height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
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
                                interval={calculateXAxisInterval(chartData.length)}
                            />
                            <YAxis
                                tick={{ fill: '#FFFFFF', fontSize: isMobile ? '8px' : '10px' }}
                            >
                                {!isMobile && 
                                    <Label 
                                        value="Number of Commits"
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
                            <Tooltip 
                                content={<CustomTooltip 
                                    isMobile={isMobile} 
                                    selectedRepo={selectedRepo}
                                />} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey={`${selectedRepo}_cumulative`}
                                stroke="#8884d8" 
                                name="Cumulative Commits"
                                dot={false}
                                activeDot={{ 
                                    r: isMobile ? 4 : 8,
                                    fill: '#01FF85',
                                    stroke: '#FFFFFF',
                                    strokeWidth: 2
                                }}
                                connectNulls={true}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default RepoCommitsChart;