import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Years Staked: ${payload[0].payload.range}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Number of Stakers: ${payload[0].value}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const StakingDistributionChart = ({ data }) => {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clickedIndex, setClickedIndex] = useState(null); // Track clicked slice index
    const [error, setError] = useState(null);

    // Custom colors for the pie chart
    const COLORS = ['#23DC8E', '#179C65', '#106F48', '#FDB366', '#0047CA', '#88018B', '#FFD700']; 

    useEffect(() => {
        setTimeout(() => {
            try {
                const processedData = data.ranges.map((range, index) => ({
                    range: range[1] === Infinity || range[1] === null ? `${range[0]}+` : `${range[0]}-${range[1]}`,
                    frequency: data.frequencies[index]
                }));

                setChartData(processedData);
                setIsLoading(false);
            } catch (e) {
                setError(e.message);
                setIsLoading(false);
            }
        }, 10);
    }, [data.ranges, data.frequencies]);

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    // Handle pie slice click event

    const handlePieClick = (index) => {
        setClickedIndex(index); // Zoom in the clicked slice
        setTimeout(() => {
            setClickedIndex(null); // Reset the zoom after 2 seconds
        }, 2000); // 2 seconds delay

    };


    return (
        <div>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="frequency"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        label={({ range }) => range}
                        style={{ outline: 'none' }}  // This removes the outline from the Pie component
                        onClick={(data, index) => handlePieClick(index)} // Handle click event on pie
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                 key={`cell-${index}`} 
                                 fill={COLORS[index % COLORS.length]} 
                                 stroke="none"  // Removes the border outline when clicked
                                 strokeWidth={0}
                                 style=
                                {{
                                    outline: 'none',  // This removes the outline from each Cell
                                    transform: clickedIndex === index ? 'scale(1.1)' : 'scale(1)',  // Zoom the clicked pie slice
                                    transformOrigin: 'center',
                                    transition: 'transform 0.2s ease-in-out'  // Smooth zoom transition
                                }}

                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '10px', color: '#FFFFFF' }}>
                Distribution of Stakers by Years Staked
            </div>
        </div>
    );
};

export default StakingDistributionChart;
