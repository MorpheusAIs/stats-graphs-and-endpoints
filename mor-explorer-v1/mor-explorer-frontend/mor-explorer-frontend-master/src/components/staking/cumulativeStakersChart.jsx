import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, parse } from 'date-fns';

const processData = (dailyUniqueStakers) => {
    let cumulativeData = [];
    let cumulativePool0 = 0;
    let cumulativePool1 = 0;
    let cumulativeCombined = 0;

    Object.entries(dailyUniqueStakers).forEach(([date, data]) => {
        cumulativePool0 += data.pool_0;
        cumulativePool1 += data.pool_1;
        cumulativeCombined += data.combined;

        const formattedDate = format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');

        cumulativeData.push({
            date: formattedDate,
            dateObj: new Date(date), // For sorting
            capital: cumulativePool0,
            code: cumulativePool1,
            combined: cumulativeCombined
        });
    });

    // Sort the data by date
    cumulativeData.sort((a, b) => a.dateObj - b.dateObj);

    return cumulativeData;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }} >
                    <p style={{ margin: '3px 0' }}>{`Capital: ${payload[0].value}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Code: ${payload[1].value}`}</p>
                    <p style={{ margin: '3px 0' }}>{`Combined: ${payload[2].value}`}</p>
                </div>
            </div>
        );
    }

    return null;
};

const CumulativeStakersChart = ({ data }) => {
    const chartData = processData(data.daily_unique_stakers);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                >
                    <Label value="Date" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />
                </XAxis>
                <YAxis tick={{ fill: '#FFFFFF', fontSize: '10px' }}>
                    <Label value="Cumulative Stakers" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="capital" stroke="#8884d8" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#8884d8" }} name="Capital" />
                <Line type="monotone" dataKey="code" stroke="#82ca9d" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#82ca9d" }} name="Code" />
                <Line type="monotone" dataKey="combined" stroke="#ffc658" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#ffc658" }} name="Combined" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default CumulativeStakersChart;