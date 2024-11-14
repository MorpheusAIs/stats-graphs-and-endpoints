import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '../utils/utils';
import { Italic } from 'lucide-react';

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
                        {`Amount: ${formatNumber(payload[0].value.toFixed(2))} MOR`}
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

const CapitalRewardsChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const COLORS = ['#23DC8E', '#88018B', '#33b5ff', '#FDB366', '#0047CA', '#88018B', '#FFD700'];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickInsideChart = event.target.closest('.recharts-wrapper');
            const isClickInsideLegend = event.target.closest('.legend-item');
            
            if (!isClickInsideChart && !isClickInsideLegend) {
                setActiveIndex(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const processChartData = () => {
        if (!data?.claim_metrics?.capital) return {
            totalData: [],
            claimedUnclaimedData: [],
            unclaimedBreakdownData: []
        };

        const capitalData = data.claim_metrics.capital;
        const totalEmissions = capitalData.total_capital_emissions;
        const claimed = capitalData.claimed_capital_rewards;
        const unclaimed = capitalData.unclaimed_capital_emissions;
        const stakedUnclaimed = capitalData.total_capital_staked_reward_sum;
        const unclaimedNotStaked = unclaimed - stakedUnclaimed;

        // Total Emissions Ring
        const totalData = [{
            name: "Total Capital Emissions",
            displayName: "Emissions",
            value: totalEmissions,
            percentage: "100",
            fill: COLORS[0]
        }];

        // Claimed vs Unclaimed Ring
        const claimedUnclaimedData = [
            {
                name: "Claimed Rewards",
                displayName: "Claimed",
                value: claimed,
                percentage: ((claimed / totalEmissions) * 100).toFixed(2),
                fill: COLORS[1]
            },
            {
                name: "Total Unclaimed",
                displayName: "Unclaimed",
                value: unclaimed,
                percentage: ((unclaimed / totalEmissions) * 100).toFixed(2),
                fill: COLORS[2]
            }
        ];

        // Unclaimed Breakdown Ring
        const unclaimedBreakdownData = [
            {
                name: "Staked Unclaimed",
                displayName: "Staked (Unclaimed)",
                value: stakedUnclaimed,
                percentage: ((stakedUnclaimed / unclaimed) * 100).toFixed(2),
                fill: COLORS[3]
            },
            {
                name: "Unstaked Unclaimed",
                displayName: "Unstaked (Unclaimed)",
                value: unclaimedNotStaked,
                percentage: ((unclaimedNotStaked / unclaimed) * 100).toFixed(2),
                fill: COLORS[4]
            }
        ];

        return {
            totalData,
            claimedUnclaimedData,
            unclaimedBreakdownData,
            legendData: [...totalData, ...claimedUnclaimedData, ...unclaimedBreakdownData]
        };
    };

    const { totalData, claimedUnclaimedData, unclaimedBreakdownData, legendData } = processChartData();

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
                MOR Capital Rewards Distribution
            </h2>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0',
                margin: '0 0 0px 0'
            }}>
                This chart represents the Total Emissions for the Capital Pool and the amount of MOR Claimed and Unclaimed till now.
                 The Unclaimed MOR also contains a sector which shows the Unclaimed MOR that has been staked till Now.
            </p>
            <p className="chart-note" style={{ 
                textAlign: 'center', 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#a0a0a0',
                margin: '0 0 0px 0'
            }}>
                Distribution of Total MOR Emissions Till Now
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
    innerRadius={isMobile ? "75%" : "70%"}  // Adjusted inner radius
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
    data={claimedUnclaimedData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={isMobile ? "70%" : "65%"}  // Adjusted outer radius
    innerRadius={isMobile ? "55%" : "50%"}  // Adjusted inner radius
    onClick={handlePieClick}
    stroke="none"
>
    {claimedUnclaimedData.map((entry, index) => (
        <Cell
            key={`cell-claimed-${index}`}
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
<Pie
    data={unclaimedBreakdownData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={isMobile ? "50%" : "45%"}  // Adjusted outer radius
    innerRadius={isMobile ? "35%" : "30%"}  // Adjusted inner radius
    onClick={handlePieClick}
    stroke="none"
>
    {unclaimedBreakdownData.map((entry, index) => (
        <Cell
            key={`cell-unclaimed-${index}`}
            fill={entry.fill}
            opacity={activeIndex === index + 3 ? 1 : activeIndex === null ? 1 : 0.3}
            style={{
                outline: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.3s ease'
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

export default CapitalRewardsChart;
