# Comprehensive Morpheus Dashboard Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Supply Component](#supply-component)
   1. [Total and Circulating Supply Chart](#total-and-circulating-supply-chart)
   2. [Price and Volume Chart](#price-and-volume-chart)
   3. [Market Cap and Protocol Liquidity Cards](#market-cap-and-protocol-liquidity-cards)
   4. [MOR Locked and Burned Chart](#mor-locked-and-burned-chart)
   5. [MOR Holders Distribution Chart](#mor-holders-distribution-chart)
3. [Staking Component](#staking-component)
   1. [Daily Stakers Chart](#daily-stakers-chart)
   2. [Staking Metrics Cards](#staking-metrics-cards)
   3. [APY and Stake Rewards Chart](#apy-and-stake-rewards-chart)
   4. [Stake Time Distribution Chart](#stake-time-distribution-chart)
   5. [Power Multiplier Distribution Chart](#power-multiplier-distribution-chart)
   6. [Emission Percentage Card](#emission-percentage-card)

## 1. Introduction

The Morpheus Dashboard provides a comprehensive view of the Morpheus token ecosystem, focusing on supply metrics and staking behavior. The dashboard is divided into two main components: Supply and Staking.

## 2. Supply Component

The Supply component visualizes key metrics related to the Morpheus token supply, including total and circulating supply, price and trading volume, market cap, protocol liquidity, locked and burned tokens, and holder distribution.

### 2.1 Total and Circulating Supply Chart

#### Description
This chart displays the total supply and circulating supply of Morpheus tokens over time.

#### API Endpoint
`/total_and_circ_supply`

#### Data Processing
```javascript
const processData = (data) => {
    return data.map(item => ({
        date: format(parse(item.date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(item.date, 'dd/MM/yyyy', new Date()),
        totalSupply: item.total_supply,
        circulatingSupply: item.circulating_supply
    })).sort((a, b) => a.dateObj - b.dateObj);
};
```

#### Visualization
```jsx
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
        <YAxis tick={{ fill: '#FFFFFF', fontSize: '10px' }} tickFormatter={(value) => formatNumberWithOutDecimal(value)}>
            <Label value="Supply" angle={-90} offset={-13} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <Line type="monotone" dataKey="totalSupply" stroke="#8884d8" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#8884d8" }} name="Total Supply" />
        <Line type="monotone" dataKey="circulatingSupply" stroke="#82ca9d" activeDot={{ r: 8, fill: '#01FF85' }} dot={{ r: 2, fill: "#82ca9d" }} name="Circulating Supply" />
    </LineChart>
</ResponsiveContainer>
```

### 2.2 Price and Volume Chart

#### Description
This chart shows the price trends of the Morpheus token and its trading volume over time.

#### API Endpoint
`/prices_and_trading_volume`

#### Data Processing
```javascript
const processData = (data) => {
    const prices = data.prices.map(([date, price]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        price: price
    }));

    const volumes = data.total_volumes.map(([date, volume]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        volume: volume
    }));

    return prices.map(priceItem => ({
        ...priceItem,
        volume: volumes.find(v => v.date === priceItem.date)?.volume || 0
    })).sort((a, b) => a.dateObj - b.dateObj);
};
```

#### Visualization
```jsx
<ResponsiveContainer width="100%" height={400}>
    {dataKey === 'price' ? (
        <LineChart data={chartData}>
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
            >
                <Label value={yAxisLabel} angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} dot={{ r: 2 }} name="Price" />
        </LineChart>
    ) : (
        <BarChart data={chartData}>
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
            <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="volume" fill="#8884d8" name="Volume" />
        </BarChart>
    )}
</ResponsiveContainer>
```

### 2.3 Market Cap and Protocol Liquidity Cards

#### Description
These cards display the current and circulating supply market cap, as well as the pool-owned liquidity in USD, MOR, and stETH.

#### API Endpoints
- Market Cap: `/get_market_cap`
- Protocol Liquidity: `/protocol_liquidity`

#### Visualization
Info cards with toggle buttons for different metrics.

### 2.4 MOR Locked and Burned Chart

#### Description
This chart shows the cumulative amount of MOR tokens that have been locked and burned over time.

#### API Endpoint
`/locked_and_burnt_mor`

#### Data Processing
```javascript
const processData = (data) => {
    const burnedData = Object.entries(data.burnt_mor.cumulative_mor_burnt).map(([date, value]) => ({
        date: format(parse(date, 'dd/MM/yyyy', new Date()), 'MMM d, yyyy'),
        dateObj: parse(date, 'dd/MM/yyyy', new Date()),
        burned: value,
        locked: data.locked_mor.cumulative_mor_locked[date]
    }));

    return burnedData.sort((a, b) => a.dateObj - b.dateObj);
};
```

#### Visualization
```jsx
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
```

### 2.5 MOR Holders Distribution Chart

#### Description
This chart displays the distribution of MOR token holders by range.

#### API Endpoint
`/mor_holders_by_range`

#### Visualization
Bar chart showing the number of holders for different MOR holding ranges.

## 3. Staking Component

The Staking component provides insights into the staking behavior of Morpheus token holders, including distribution of stake times, power multipliers, and emission statistics.

### 3.1 Daily Stakers Chart

#### Description
This chart displays the daily number of unique stakers for each pool (Capital and Code) and the combined total.

#### API Endpoint
`/analyze-mor-stakers`

#### Visualization
Line chart showing daily unique stakers for Capital (Pool 0), Code (Pool 1), and Combined.

### 3.2 Staking Metrics Cards

#### Description
These cards display various staking metrics including average stake time, average multiplier, and MOR rewards.

#### API Endpoint
`/analyze-mor-stakers`

#### Visualization
Info cards showing metrics for Capital (Pool 0), Code (Pool 1), and Combined.

### 3.3 APY and Stake Rewards Chart

#### Description
This chart displays the APY and daily MOR rewards per stETH for different staking periods.

#### API Endpoint
`/give_mor_reward`

#### Visualization
Line chart with toggle button for APY/Rewards, X-axis showing staking period in days.

### 3.4 Stake Time Distribution Chart

#### Description
This chart shows the distribution of stake times among users.

#### API Endpoint
`/get_stake_info`

#### Visualization
```jsx
<ResponsiveContainer width="100%" height={400}>
    <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
    >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis
            dataKey="range"
            tick={{ fill: '#FFFFFF', fontSize: '12px' }}
            interval={0}
        >
            <Label value="Years Staked" offset={-20} position="insideBottom" style={{ fill: '#FFFFFF', fontWeight: 'bold' }} />
        </XAxis>
        <YAxis tick={{ fill: '#FFFFFF', fontSize: '12px' }}>
            <Label value="Number of Stakers" angle={-90} position="insideLeft" style={{ fill: '#FFFFFF', fontWeight: 'bold', textAnchor: 'middle' }} />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <Bar dataKey="frequency" fill="#8884d8" name="Number of Stakers" />
    </BarChart>
</ResponsiveContainer>
```

### 3.5 Power Multiplier Distribution Chart

#### Description
This chart shows the distribution of power multipliers among stakers.

#### API Endpoint
`/get_stake_info`

#### Visualization
Similar to Stake Time Distribution Chart, but with "Power Multiplier Range" on X-axis.

### 3.6 Emission Percentage Card

#### Description
This card shows the daily and total percentage of emissions allocated to stakers.

#### API Endpoint
`/analyze-mor-stakers`

#### Calculation
```javascript
const getDailyMorStakeEmittedPercentage = () => {
    let daily_relative_emission_percentage = 0
    if (selectedUniqueStaker.key === 'pool_0') {
        daily_relative_emission_percentage = (data.stakereward_analysis['0'].daily_reward_sum / data.emissionreward_analysis.new_emissions['Capital Emission']) * 100
    }
    else if (selectedUniqueStaker.key === 'pool_1') {
        daily_relative_emission_percentage = (data.stakereward_analysis['1'].daily_reward_sum / data.emissionreward_analysis.new_emissions['Code Emission']) * 100
    }
    else {
        daily_relative_emission_percentage = (
            (data.stakereward_analysis['0'].daily_reward_sum + data.stakereward_analysis['1'].daily_reward_sum) /
            (data.emissionreward_analysis.new_emissions['Capital Emission'] + data.emissionreward_analysis.new_emissions['Code Emission'])
        )
            * 100
    }
    return daily_relative_emission_percentage;
}

const getTotalMorStakeEmittedPercentage = () => {
    let total_relative_emission_percentage = 0
    if (selectedUniqueStaker.key === 'pool_0') {
        total_relative_emission_percentage = (data.stakereward_analysis['0'].total_current_user_reward_sum / data.emissionreward_analysis.total_emissions['Capital Emission']) * 100
    }
    else if (selectedUniqueStaker.key === 'pool_1') {
        total_relative_emission_percentage = (data.stakereward_analysis['1'].total_current_user_reward_sum / data.emissionreward_analysis.total_emissions['Code Emission']) * 100
    }
    else {
        total_relative_emission_percentage = (
            (data.stakereward_analysis['0'].total_current_user_reward_sum + data