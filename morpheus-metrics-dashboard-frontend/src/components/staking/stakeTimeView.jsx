import React, { useState, useEffect } from 'react';
import { ToggleButtonGroup, DataCard, formatNumber } from '../utils/utils';
import { Info } from 'lucide-react';
import "./../../css/staking/stakingView.css";
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

const formatDaysToYearsMonthsDays = (daysString) => {
    const match = daysString.match(/(\d+) days/);
    if (!match) return daysString;

    const totalDays = parseInt(match[1]);
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);

    let result = [];
    if (years > 0) result.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} month${months > 1 ? 's' : ''}`);

    return result.join(', ');
};

const StakingMetricsCard = ({ averageMultiplier, averageStakeTime, dailyRewards, totalRewards, uniqueStakers, dailyEmittedPercentage, averageAPR }) => {
    return (
        <div className="staking_metrics_card">
            <DataCard
                title="Average Multiplier"
                value={averageMultiplier}
                subcontent={null}
                prefix={null}
                suffix="x"
            />
            <DataCard
                title="Average Stake Time"
                value={averageStakeTime}
                subcontent={null}
                prefix={null}
                suffix={null}
            />
            <DataCard
                title="Total Unique Stakers"
                value={uniqueStakers.toString()}
                subcontent={null}
                prefix={null}
                suffix={null}
            />
            <DataCard
                title="MOR Rewards Staked (Daily / Total)"
                value={`${formatNumber(dailyRewards).split('.')[0]} / ${formatNumber(totalRewards).split('.')[0]}`}
                subcontent={null}
                prefix={null}
                suffix={null}
            />
            <DataCard
                title="% Staked to Daily Emitted"
                value={dailyEmittedPercentage.toFixed(2)}
                subcontent={null}
                prefix={null}
                suffix="%"
            />
            <DataCard
                title="Average APR"
                value={averageAPR.toFixed(2)}
                subcontent={null}
                prefix={null}
                suffix="%"
            />
        </div>
    );
};

const StakeTimeView = () => {
    const [data, setData] = useState(null);
    const [historicalData, setHistoricalData] = useState(null);
    const [pool0Stakers, setPool0Stakers] = useState(0);
    const [pool1Stakers, setPool1Stakers] = useState(0);
    const [combinedStakers, setCombinedStakers] = useState(0);

    const options = [
        { key: 'combined', value: 'Combined' },
        { key: 'capital', value: 'Capital' },
        { key: 'code', value: 'Code' }
    ];

    const [selectedOption, setSelectedOption] = useState(options[0]);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stakersResponse, historicalResponse] = await Promise.all([
                    fetch(`${base_api_url}/analyze-mor-stakers`),
                    fetch(`${base_api_url}/historical_mor_rewards_locked`)
                ]);

                const stakersData = await stakersResponse.json();
                const historicalData = await historicalResponse.json();

                // Get latest date's data from historical rewards
                const dates = Object.keys(historicalData).sort();
                const latestDate = dates[dates.length - 1];
                setHistoricalData(historicalData[latestDate]);

                if (stakersData.staker_analysis && stakersData.staker_analysis.total_unique_stakers) {
                    const uniqueStakers = stakersData.staker_analysis.total_unique_stakers;
                    setPool0Stakers(uniqueStakers.pool_0 || 0);
                    setPool1Stakers(uniqueStakers.pool_1 || 0);
                    setCombinedStakers(uniqueStakers.combined || 0);
                }

                setData(stakersData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const getDataForOption = (option) => {
        const key = option.key;
        const poolKey = key === 'capital' ? 'pool_0' : key === 'code' ? 'pool_1' : 'combined';
        const stakerewardKey = key === 'capital' ? '0' : key === 'code' ? '1' : 'combined';

        const multiplierAnalysis = data?.multiplier_analysis || {};
        const stakerAnalysis = data?.staker_analysis || {};
        const stakerewardAnalysis = data?.stakereward_analysis || {};
        const emissionrewardAnalysis = data?.emissionreward_analysis || {};

        // Get daily rewards from stakereward analysis
        let dailyRewards;
        if (key === 'combined') {
            dailyRewards = (stakerewardAnalysis['0']?.daily_reward_sum || 0) + 
                          (stakerewardAnalysis['1']?.daily_reward_sum || 0);
        } else {
            dailyRewards = stakerewardAnalysis[stakerewardKey]?.daily_reward_sum || 0;
        }

        // Get total rewards from historical data
        let totalRewards = 0;
        if (historicalData) {
            if (key === 'combined') {
                totalRewards = historicalData.total;
            } else if (key === 'capital') {
                totalRewards = historicalData.capital;
            } else {
                totalRewards = historicalData.code;
            }
        }

        // Get emissions data
        let dailyEmission, totalEmission;
        if (key === 'combined') {
            dailyEmission = (emissionrewardAnalysis.new_emissions?.['Capital Emission'] || 0) + 
                           (emissionrewardAnalysis.new_emissions?.['Code Emission'] || 0);
            totalEmission = (emissionrewardAnalysis.total_emissions?.['Capital Emission'] || 0) + 
                           (emissionrewardAnalysis.total_emissions?.['Code Emission'] || 0);
        } else {
            const emissionType = key === 'capital' ? 'Capital Emission' : 'Code Emission';
            dailyEmission = emissionrewardAnalysis.new_emissions?.[emissionType] || 0;
            totalEmission = emissionrewardAnalysis.total_emissions?.[emissionType] || 0;
        }

        // Calculate APR (Annual Percentage Rate)
        // APR = (Daily Rewards * 365 / Total Rewards) * 100
        const averageAPR = totalRewards > 0 ? (dailyRewards * 365 / totalRewards) * 100 : 0;

        return {
            averageMultiplier: (key === 'combined' 
                ? multiplierAnalysis.overall_average / 1e7
                : multiplierAnalysis[`${key}_average`] / 1e7).toFixed(2),
            averageStakeTime: key === 'combined'
                ? formatDaysToYearsMonthsDays(stakerAnalysis.combined_average_stake_time || '0 days')
                : formatDaysToYearsMonthsDays(stakerAnalysis.average_stake_time?.[stakerewardKey] || '0 days'),
            dailyRewards: dailyRewards,
            totalRewards: totalRewards,
            uniqueStakers: Math.round(key === 'combined' ? combinedStakers : key === 'capital' ? pool0Stakers : pool1Stakers),
            dailyEmittedPercentage: dailyEmission ? (dailyRewards / dailyEmission) * 100 : 0,
            averageAPR: averageAPR
        };
    };

    const currentData = getDataForOption(selectedOption);

    return (
        <div className="staking_time_main_grid">
            <div className="staking_metrics_container">
                <div className="toggle_and_info">
                    <ToggleButtonGroup
                        options={options}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        getOptionLabel={(option) => option.value}
                    />
                    <div className="info_icon">
                        <Info
                            size={18}
                            color="#01FF85"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        />
                        {showTooltip && (
                            <div className="tooltip">
                                <p>NOTE: Combined option doesn't necessarily show the sum of Capital + Code Pool</p>
                                <p>- This is because some stakers might've staked in both pools</p>
                                <p>- This allows us to present the uniqueness in data for stakers of both pools and combined</p>
                            </div>
                        )}
                    </div>
                </div>
                <StakingMetricsCard {...currentData} />
            </div>
        </div>
    );
};

export default StakeTimeView;