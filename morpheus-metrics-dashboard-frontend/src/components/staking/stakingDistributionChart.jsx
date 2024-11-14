import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumberWithOutDecimal, ToggleButtonGroup } from '../utils/utils';
import api_url from './../../config/api_url.json';

const base_api_url = api_url.base_api_url;

const COLORS = ['#23DC8E', '#179C65', '#106F48', '#FDB366', '#0047CA', '#88018B', '#FFD700'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Years Staked: ${payload[0].payload.range}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Number of Stakers: ${formatNumberWithOutDecimal(payload[0].value)}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Percentage: ${payload[0].payload.percentage}%`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload, activeIndex, onLegendClick, isMobile }) => {
    if (!payload || !Array.isArray(payload) || payload.length === 0) return null;
    
    return (
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
                {payload.map((entry, index) => {
                    if (!entry || typeof entry !== 'object') return null;
                    const value = entry.value || '';
                    const color = entry.color || '#000';
                    const percentage = entry.payload && entry.payload.percentage ? entry.payload.percentage : '';
                    
                    return (
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
                                backgroundColor: color,
                                marginRight: '8px',
                                borderRadius: '2px'
                            }} />
                            <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%'
}}>
    <span>{value}</span>
    <span style={{ color: '#888' }}>{percentage}%</span>
</div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const StakingDistributionChart = () => {
    const [chartData, setChartData] = useState([]);
    const [rawData, setRawData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);
    const [selectedType, setSelectedType] = useState('combined');
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

    const typeOptions = [
        { key: 'combined', value: 'Combined' },
        { key: 'capital', value: 'Capital' },
        { key: 'code', value: 'Code' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/get_stake_info`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setRawData(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Fetch error:', error);
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const processData = () => {
            if (!rawData || !rawData[selectedType]) return;

            try {
                const currentData = rawData[selectedType].stake_time;
                const processedData = currentData.ranges.map((range, index) => ({
                    range: range[1] === null ? `${range[0]}+` : `${range[0]}-${range[1]}`,
                    value: currentData.frequencies[index]
                }));
                
                const total = processedData.reduce((sum, item) => sum + item.value, 0);
                const finalData = processedData.map(item => ({
                    ...item,
                    percentage: ((item.value / total) * 100).toFixed(2)
                }));
                
                setChartData(finalData);
            } catch (e) {
                console.error('Data processing error:', e);
                setError(e.message);
            }
        };

        processData();
    }, [rawData, selectedType]);

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

    const renderChartContent = () => (
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
                height: isMobile ? '60%' : '100%' 
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
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
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
                        value: entry.range,
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
                Stake Time Distribution
            </h2>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0' 
            }}>
                Values are in the form of years
            </p>
            <div className="toggle-container">
                <ToggleButtonGroup
                    options={typeOptions}
                    selectedOption={typeOptions.find(opt => opt.key === selectedType)}
                    setSelectedOption={(option) => setSelectedType(option.key)}
                />
            </div>
            {renderChartContent()}
            {!isMobile && (
                <div style={{ 
                    textAlign: 'center', 
                    fontStyle: 'italic', 
                    marginTop: '20px', 
                    color: '#FFFFFF', 
                    fontSize: '14px' 
                }}>
                    Distribution of Stakers by Years Staked
                </div>
            )}
        </div>
    );
};

export default StakingDistributionChart;