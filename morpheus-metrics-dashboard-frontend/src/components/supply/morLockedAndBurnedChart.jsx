import React, { useState, useEffect } from 'react';
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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#000000', color: '#01FF85', padding: '10px', borderRadius: '5px', border: "2px solid #494949" }}>
                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
                <div style={{ color: 'white' }}>
                    {payload.map((entry, index) => (
                        <p style={{ margin: '3px 0' }}>
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

    useEffect(() => {
        // Function to fetch data from API
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
        fetchData()
    }, []);

    const options = [
        { key: 'burned', value: 'Burned MOR' },
        { key: 'locked', value: 'Locked MOR' }
    ];

    const dataKey = selectedOption.key;
    const yAxisLabel = 'Cumulative MOR';

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }


    return (
        <div className="supply_chart_background">
            <div className="supply_main_flex">
                <ToggleButtonGroup
                    options={options}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                />
                <br />
                <h2 className="chartheading">
                    {dataKey === 'burned' ? "Burned MOR Chart" : "Locked MOR Chart"}
                </h2>
                <div className="mt-4 text-white text-center">
                    <p>Total {selectedOption.value} till now: {dataKey === 'burned' ? chartDataRaw.burnt_mor.total_burnt_till_now.toFixed(2) : chartDataRaw.locked_mor.total_locked_till_now.toFixed(2)} MOR</p>
                </div>
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
                        <YAxis
                            tick={{ fill: '#FFFFFF', fontSize: '10px' }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => formatNumberWithOutDecimal(value)}
                        >
                            <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#8884d8" }} name={selectedOption.value} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

    );
};

export default MorLockedAndBurnedChart;