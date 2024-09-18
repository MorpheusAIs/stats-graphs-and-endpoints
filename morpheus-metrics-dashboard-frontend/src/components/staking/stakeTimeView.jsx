import React, { useState, useEffect } from 'react';
import { ToggleButtonGroup, DataCard, formatNumber } from '../utils/utils';
import { Info } from 'lucide-react';
import CumulativeStakersChart from './cumulativeStakersChart';
import "./../../css/staking/stakingView.css";
import api_url from "./../../config/api_url.json";

const base_api_url = api_url.base_api_url;

// Helper function to format days into years and months
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

// Metrics Card Component for displaying various staking metrics
const StakingMetricsCard = ({ averageMultiplier, averageStakeTime, dailyRewards, totalRewards, uniqueStakers, dailyEmittedPercentage, totalEmittedPercentage }) => {
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
                title="MOR Rewards Staked (Daily / Total)"
                value={`${formatNumber(dailyRewards.toFixed(2))} / ${formatNumber(totalRewards.toFixed(2))}`}
                subcontent={null}
                prefix={null}
                suffix={null}
            />
            <DataCard
                title="Total Unique Stakers"
                value={uniqueStakers.toString()} // Display as a whole number string
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
                title="% Staked to Total Emitted"
                value={totalEmittedPercentage.toFixed(2)}
                subcontent={null}
                prefix={null}
                suffix="%"
            />
        </div>
    );
};

// Main View Component for Staking Metrics
const StakeTimeView = () => {
    const [data, setData] = useState(null); // Store the fetched data
    const [pool0Stakers, setPool0Stakers] = useState(0); // Unique stakers for pool_0
    const [pool1Stakers, setPool1Stakers] = useState(0); // Unique stakers for pool_1
    const [combinedStakers, setCombinedStakers] = useState(0); // Combined unique stakers

    // Options for staker pools
    const options = [
        { key: 'capital', value: 'Capital' },
        { key: 'code', value: 'Code' },
        { key: 'combined', value: 'Combined' }
    ];

    // State to manage the selected option and tooltip visibility
    const [selectedOption, setSelectedOption] = useState(options[2]);
    const [showTooltip, setShowTooltip] = useState(false);

    // Fetch unique stakers data from the API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/analyze-mor-stakers`);
                const jsonData = await response.json();

                // Extract and store unique stakers
                if (jsonData.staker_analysis && jsonData.staker_analysis.total_unique_stakers) {
                    const uniqueStakers = jsonData.staker_analysis.total_unique_stakers;
                    setPool0Stakers(uniqueStakers.pool_0 || 0);
                    setPool1Stakers(uniqueStakers.pool_1 || 0);
                    setCombinedStakers(uniqueStakers.combined || 0);
                }

                setData(jsonData); // Store the complete data object
            } catch (error) {
            }
        };

        fetchData();
    }, []); // Empty dependency array ensures this runs once when the component mounts

    // Function to fetch the appropriate data based on the selected option
    const getDataForOption = (option) => {
        const key = option.key;
        const poolKey = key === 'capital' ? 'pool_0' : key === 'code' ? 'pool_1' : 'combined';
        const stakerewardKey = key === 'capital' ? '0' : key === 'code' ? '1' : 'combined';

        const multiplierAnalysis = data?.multiplier_analysis || {};
        const stakerAnalysis = data?.staker_analysis || {};
        const stakerewardAnalysis = data?.stakereward_analysis || {};
        const emissionrewardAnalysis = data?.emissionreward_analysis || {};

        let dailyRewards, totalRewards, dailyEmission, totalEmission, uniqueStakers, averageMultiplier;

        // Use the unique stakers data we fetched
        if (key === 'combined') {
            dailyRewards = (stakerewardAnalysis['0']?.daily_reward_sum || 0) + (stakerewardAnalysis['1']?.daily_reward_sum || 0);
            totalRewards = (stakerewardAnalysis['0']?.total_current_user_reward_sum || 0) + (stakerewardAnalysis['1']?.total_current_user_reward_sum || 0);
            dailyEmission = (emissionrewardAnalysis.new_emissions?.['Capital Emission'] || 0) + (emissionrewardAnalysis.new_emissions?.['Code Emission'] || 0);
            totalEmission = (emissionrewardAnalysis.total_emissions?.['Capital Emission'] || 0) + (emissionrewardAnalysis.total_emissions?.['Code Emission'] || 0);
            uniqueStakers = combinedStakers; // Use combined unique stakers
            averageMultiplier = multiplierAnalysis.overall_average / 1e7;
        } else {
            dailyRewards = stakerewardAnalysis[stakerewardKey]?.daily_reward_sum || 0;
            totalRewards = stakerewardAnalysis[stakerewardKey]?.total_current_user_reward_sum || 0;
            dailyEmission = emissionrewardAnalysis.new_emissions?.[`${key === 'capital' ? 'Capital' : 'Code'} Emission`] || 0;
            totalEmission = emissionrewardAnalysis.total_emissions?.[`${key === 'capital' ? 'Capital' : 'Code'} Emission`] || 0;
            uniqueStakers = key === 'capital' ? pool0Stakers : pool1Stakers; // Use pool_0 or pool_1 unique stakers
            averageMultiplier = multiplierAnalysis[`${key}_average`] / 1e7;
        }

        return {
            averageMultiplier: averageMultiplier.toFixed(2),
            averageStakeTime: key === 'combined'
                ? formatDaysToYearsMonthsDays(stakerAnalysis.combined_average_stake_time || '0 days')
                : formatDaysToYearsMonthsDays(stakerAnalysis.average_stake_time?.[stakerewardKey] || '0 days'),
            dailyRewards: dailyRewards,
            totalRewards: totalRewards,
            uniqueStakers: Math.round(uniqueStakers),
            dailyEmittedPercentage: dailyEmission ? (dailyRewards / dailyEmission) * 100 : 0,
            totalEmittedPercentage: totalEmission ? (totalRewards / totalEmission) * 100 : 0
        };
    };

    // Fetch the current data based on the selected option
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
