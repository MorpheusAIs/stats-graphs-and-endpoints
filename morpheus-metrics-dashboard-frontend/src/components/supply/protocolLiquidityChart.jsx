import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '../utils/utils';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ 
                backgroundColor: '#000000', 
                color: '#01FF85', 
                padding: '10px', 
                borderRadius: '5px', 
                border: "2px solid #494949"
            }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{payload[0].payload.displayName}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>
                        {`Value: $${formatNumber(payload[0].value.toFixed(2))}`}
                    </p>
                    <p style={{ margin: '3px 0' }}>
                        {`Percentage: ${payload[0].payload.percentage}%`}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload, activeIndex, onLegendClick }) => {
    if (!payload || !Array.isArray(payload) || payload.length === 0) return null;
    
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            width: '100%' 
        }}>
            <p style={{ 
                margin: '0 0 5px 0',
                color: '#888',
                fontSize: '11px',
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
                gap: '8px',
                width: '100%'
            }}>
                {payload.map((entry, index) => (
                    <li 
                        key={`item-${index}`} 
                        className="legend-item"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            opacity: activeIndex === null || activeIndex === index ? 1 : 0.3,
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => onLegendClick(index)}
                    >
                        <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: entry.fill,
                            marginRight: '8px',
                            borderRadius: '2px'
                        }} />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            color: '#FFFFFF'
                        }}>
                            <span style={{ 
                                marginRight: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {entry.displayName}
                            </span>
                            <span style={{ 
                                color: '#888', 
                                minWidth: '45px', 
                                textAlign: 'right',
                                marginLeft: 'auto'
                            }}>
                                {entry.percentage}%
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ProtocolLiquidityChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [centerValue, setCenterValue] = useState(data.total_value_usd);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const COLORS = ['#23DC8E', '#0047CA', '#fdb366'];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInsideChart = event.target.closest('.recharts-wrapper');
            const isClickInsideLegend = event.target.closest('.legend-item');
            if (!isClickInsideChart && !isClickInsideLegend) {
                setActiveIndex(null);
                setCenterValue(data.total_value_usd);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [data.total_value_usd]);

    // Update center value when active index changes
    useEffect(() => {
        if (activeIndex === null) {
            setCenterValue(data.total_value_usd);
        } else if (activeIndex === 0) {
            setCenterValue(data.total_value_usd);
        } else if (activeIndex === 1) {
            setCenterValue(data.arb_pool_values.arb_pool_usd_value);
        } else if (activeIndex === 2) {
            setCenterValue(data.base_pool_values.base_pool_usd_value);
        }
    }, [activeIndex, data]);

    const formatValueInMillions = (value) => {
        const million = 1000000;
        const thousand = 1000;
        
        if (value >= million) {
            return `$${(value / million).toFixed(2)}M`;
        } else if (value >= thousand) {
            return `$${(value / thousand).toFixed(1)}K`;
        }
        return `$${formatNumber(value.toFixed(2))}`;
    };

    const totalData = [{
        name: "Total PoL",
        displayName: "Total PoL",
        value: data.total_value_usd,
        percentage: "100",
        fill: COLORS[0]
    }];

    const chainData = [
        {
            name: "Arbitrum PoL",
            displayName: "ARB PoL",
            value: data.arb_pool_values.arb_pool_usd_value,
            percentage: ((data.arb_pool_values.arb_pool_usd_value / data.total_value_usd) * 100).toFixed(2),
            fill: COLORS[1]
        },
        {
            name: "Base PoL",
            displayName: "BASE PoL",
            value: data.base_pool_values.base_pool_usd_value,
            percentage: ((data.base_pool_values.base_pool_usd_value / data.total_value_usd) * 100).toFixed(2),
            fill: COLORS[2]
        }
    ];

    const legendData = [...totalData, ...chainData];

    const handlePieClick = (_, index) => {
        setActiveIndex(prev => prev === index ? null : index);
    };

    const handleLegendClick = (index) => {
        setActiveIndex(prev => prev === index ? null : index);
    };

    return (
        <div className="supply_chart_background" style={{ 
            padding: '20px', 
            maxWidth: '100%', 
            backgroundColor: '#1E1E1E', 
            borderRadius: '8px', 
            height: '100%' 
        }}>
            <h2 className="chartheading" style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                margin: '0 0 8px 0',
                textAlign: 'center', 
                color: '#FFFFFF' 
            }}>
                Protocol Owned Liquidity
            </h2>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0',
                margin: '0 0 0px 0'
            }}>
                Visualisation of PoL Values in USD for MOR Arbitrum Pool, Base Pool and both pools combined.
            </p>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0',
                margin: '0 0 0px 0'
            }}>
                Total Value: ${formatNumber(data.total_value_usd.toFixed(2))}
            </p>
            <div style={{ 
                height: isMobile ? '300px' : '400px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{ 
                    width: isMobile ? '100%' : '60%', 
                    height: isMobile ? '60%' : '100%' 
                }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={totalData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={isMobile ? "90%" : "85%"}
                                innerRadius={isMobile ? "80%" : "75%"}
                                onClick={handlePieClick}
                                stroke="none"
                            >
                                {totalData.map((entry, index) => (
                                    <Cell
                                        key={`cell-total-${index}`}
                                        fill={entry.fill}
                                        opacity={activeIndex === 0 ? 1 : activeIndex === null ? 1 : 0.3}
                                        style={{
                                            outline: 'none',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.3s ease'
                                        }}
                                    />
                                ))}
                            </Pie>
                            <Pie
                                data={chainData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={isMobile ? "75%" : "70%"}
                                innerRadius={isMobile ? "65%" : "60%"}
                                onClick={handlePieClick}
                                stroke="none"
                            >
                                {chainData.map((entry, index) => (
                                    <Cell
                                        key={`cell-chain-${index}`}
                                        fill={entry.fill}
                                        opacity={activeIndex === index + 1 ? 1 : activeIndex === null ? 1 : 0.3}
                                        style={{
                                            outline: 'none',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.3s ease'
                                        }}
                                    />
                                ))}
                            </Pie>
                            <text
                                x="50%"
                                y="45%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fontSize: isMobile ? '12px' : '14px',
                                    fill: '#888888',
                                    fontFamily: 'Arial'
                                }}
                            >
                                {activeIndex === null || activeIndex === 0 ? 'Total PoL Value' : 
                                 activeIndex === 1 ? 'ARB PoL Value' : 'BASE PoL Value'}
                            </text>
                            <text
                                x="50%"
                                y="55%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fontSize: isMobile ? '24px' : '28px',
                                    fill: '#FFFFFF',
                                    fontWeight: 'bold',
                                    fontFamily: 'Arial'
                                }}
                            >
                                {formatValueInMillions(centerValue)}
                            </text>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ 
                    width: isMobile ? '100%' : '40%', 
                    height: isMobile ? '40%' : '100%',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <CustomLegend 
                        payload={legendData}
                        activeIndex={activeIndex}
                        onLegendClick={handleLegendClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProtocolLiquidityChart;