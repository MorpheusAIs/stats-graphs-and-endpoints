import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { formatNumberWithOutDecimal } from '../utils/utils';
import api_url from './../../config/api_url.json';

const base_api_url = api_url.base_api_url;

const formatRange = (range) => {
    // Convert ranges like 10000-50000 to 10K-50K
    const [min, max] = range.split('-').map(num => Number(num));
    const formatNumber = (num) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}K`;
        }
        return num;
    };

    // Handle cases where max could be Infinity or null
    if (!max || max === Infinity) {
        return `${formatNumber(min)}+`;
    }
    return `${formatNumber(min)} - ${formatNumber(max)}`;
};

const processData = (data) => {
    return Object.entries(data.range_counts).map(([range, count]) => ({
        range: formatRange(range), // Apply the formatRange function
        count
    }));
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Range: ${payload[0].payload.range}`}</p>
                <div style={{ color: 'white' }}>
                    <p style={{ margin: '3px 0' }}>{`Number of Holders: ${formatNumberWithOutDecimal(payload[0].value)}`}</p>
                </div>
            </div>
        );
    }
    return null;
};

const MORHoldersDistribution = () => {
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clickedIndex, setClickedIndex] = useState(null); // Track clicked slice index
    const [error, setError] = useState(null);

    // Modified to ensure distinct colors for all slices
    const COLORS = ['#23DC8E', '#179C65', '#106F48', '#FDB366', '#0047CA', '#88018B', '#FFD700']; // Added new color

    useEffect(() => {
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/mor_holders_by_range`);
                const data = await response.json();
                const process_data = processData(data);
                setChartData(process_data);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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
        <div className="supply_chart_background">
            <br />
            <h2 className="chartheading">
                Number of MOR Holders by Range
            </h2>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="count"
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
                                style={{
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
            {/* New label added at the bottom */}
            <div style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '10px', color: '#FFFFFF' }}>
                Distribution of MOR holders by Amount of MOR Held
            </div>
        </div>
    );
};

export default MORHoldersDistribution;
