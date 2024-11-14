import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumberWithOutDecimal, ToggleButtonGroup } from '../utils/utils';
import api_url from './../../config/api_url.json';

const base_api_url = api_url.base_api_url;

const COLORS = ['#23DC8E', '#179C65', '#106F48', '#FDB366', '#0047CA', '#88018B', '#FFD700', '#3372f9', '#867cff'];

const formatRange = (range) => {
    const [min, max] = range.split('-').map(num => Number(num));
    const formatNumber = (num) => num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num;
    return !max || max === Infinity ? `${formatNumber(min)}+` : `${formatNumber(min)} - ${formatNumber(max)}`;
};

const processData = (data, selectedNetwork, isMobile) => {
    if (!data || !data[selectedNetwork]) return [];
    
    let processedData = Object.entries(data[selectedNetwork]).map(([range, count]) => ({
        range,
        originalRange: range,
        displayRange: formatRange(range),
        value: count
    }));

    if (isMobile) {
        // Combine first 4 ranges (0-100) on mobile
        const rangesToCombine = ['0-10', '10-25', '25-50', '50-100'];
        const combinedValue = processedData
            .filter(item => rangesToCombine.includes(item.originalRange))
            .reduce((sum, item) => sum + item.value, 0);

        processedData = [
            {
                range: '0-100',
                originalRange: '0-100',
                displayRange: '0 - 100',
                value: combinedValue
            },
            ...processedData.filter(item => !rangesToCombine.includes(item.originalRange))
        ];
    }

    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    return processedData.map(item => ({
        ...item,
        percentage: ((item.value / total) * 100).toFixed(2)
    }));
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Range: ${payload[0].payload.displayRange}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Number of Holders: ${formatNumberWithOutDecimal(payload[0].value)}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Percentage: ${payload[0].payload.percentage}%`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload, activeIndex, onLegendClick, isMobile }) => (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        width: '100%',
        paddingRight: isMobile ? '10px' : '0'
    }}>
        <p style={{ 
            margin: 0, 
            color: '#888', 
            fontSize: isMobile ? '10px' : '11px', 
            textAlign: 'center' 
        }}>
            Click on the legend to highlight
        </p>
        <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '8px' : '12px',  
            width: '100%' 
        }}>
            {payload.map((entry, index) => (
                <li 
                    key={`item-${index}`} 
                    className="legend-item"
                    onClick={() => onLegendClick(index)}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                        cursor: 'pointer',
                        fontSize: isMobile ? '10px' : '12px',
                        color: '#FFFFFF',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div style={{ 
                        width: isMobile ? '10px' : '12px', 
                        height: isMobile ? '10px' : '12px', 
                        backgroundColor: entry.color, 
                        marginRight: '8px', 
                        borderRadius: '2px' 
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{entry.displayRange}</span>
                        <span style={{ color: '#888' }}>{entry.payload.percentage}%</span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

const MORHoldersDistribution = () => {
    const [chartData, setChartData] = useState([]);
    const [rawData, setRawData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);
    const [selectedNetwork, setSelectedNetwork] = useState('total');
    const [isMobile, setIsMobile] = useState(false);

    const chartRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const networkOptions = [
        { key: 'total', value: 'Total' },
        { key: 'Ethereum', value: 'Ethereum' },
        { key: 'Arbitrum', value: 'Arbitrum' },
        { key: 'Base', value: 'Base' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/mor_holders_by_range`);
                const data = await response.json();
                setRawData(data);
                setChartData(processData(data, 'total', isMobile));
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [isMobile]);

    useEffect(() => {
        if (rawData) {
            setChartData(processData(rawData, selectedNetwork, isMobile));
        }
    }, [selectedNetwork, rawData, isMobile]);

    const handlePieClick = useCallback((_, index) => {
        setActiveIndex(prevIndex => prevIndex === index ? null : index);
    }, []);

    const handleLegendClick = useCallback((index) => {
        setActiveIndex(prevIndex => prevIndex === index ? null : index);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chartRef.current && !chartRef.current.contains(event.target)) {
                setActiveIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderChartContent = () => {
        const totalHolders = chartData.reduce((sum, item) => sum + item.value, 0);
        
        return (
            <div 
                ref={chartRef} 
                style={{ 
                    width: '100%', 
                    height: isMobile ? 500 : 400, 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center', 
                    gap: '20px' 
                }}
            >
                <div style={{ 
                    width: isMobile ? '100%' : '60%', 
                    height: isMobile ? '60%' : '100%',
                    position: 'relative'
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                outerRadius={isMobile ? "90%" : "85%"}
                                innerRadius={isMobile ? "65%" : "60%"}
                                onClick={handlePieClick}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke="none"
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                        style={{
                                            outline: 'none',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.3s ease'
                                        }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <text
                                x="50%"
                                y="47%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fontSize: isMobile ? '12px' : '14px',
                                    fill: '#888888',
                                    fontFamily: 'Arial'
                                }}
                            >
                                Total Holders
                            </text>
                            <text
                                x="50%"
                                y="53%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fontSize: isMobile ? '24px' : '28px',
                                    fill: '#FFFFFF',
                                    fontWeight: 'bold',
                                    fontFamily: 'Arial'
                                }}
                            >
                                {formatNumberWithOutDecimal(totalHolders)}
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ 
                    width: isMobile ? '100%' : '40%', 
                    padding: isMobile ? '0 10px' : '20px',
                    height: isMobile ? '40%' : 'auto',
                    overflow: 'hidden'
                }}>
                    <CustomLegend 
                        payload={chartData.map((entry, index) => ({
                            displayRange: entry.displayRange,
                            color: COLORS[index % COLORS.length],
                            payload: entry
                        }))}
                        activeIndex={activeIndex}
                        onLegendClick={handleLegendClick}
                        isMobile={isMobile}
                    />
                </div>
            </div>
        );
    };

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    return (
        <div className="supply_chart_background" style={{ 
            padding: isMobile ? '15px' : '20px', 
            maxWidth: '100%', 
            backgroundColor: '#1E1E1E', 
            borderRadius: '8px' 
        }}>
            <h2 className="chartheading" style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                margin: '10px 0', 
                textAlign: 'center', 
                color: '#FFFFFF' 
            }}>
                Number of MOR Holders by Range
            </h2>
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={networkOptions}
                    selectedOption={networkOptions.find(opt => opt.key === selectedNetwork)}
                    setSelectedOption={(option) => setSelectedNetwork(option.key)}
                />
            </div>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0' 
            }}>
                {`Addresses which hold $MOR on ${selectedNetwork === 'total' ? 'ETH, ARB or BASE' : selectedNetwork}`}
            </p>
            {renderChartContent()}
            {!isMobile && (
                <div style={{ 
                    textAlign: 'center', 
                    fontStyle: 'italic', 
                    marginTop: '20px', 
                    color: '#FFFFFF', 
                    fontSize: '14px' 
                }}>
                    Distribution of MOR holders by Amount of MOR Held
                </div>
            )}
        </div>
    );
};

export default MORHoldersDistribution;