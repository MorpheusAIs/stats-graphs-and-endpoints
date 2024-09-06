import React, { useState } from 'react';
import { ToggleButtonGroup, DataCard, formatNumber } from '../utils/utils';
import "./../../css/staking/stakingView.css"

// Helper function to format days into years, months, and days
const formatDaysToYearsMonthsDays = (daysString) => {
    const match = daysString.match(/(\d+) days/);
    if (!match) return daysString; // Return original string if no match

    const totalDays = parseInt(match[1]);
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays % 30;

    let result = [];
    if (years > 0) result.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) result.push(`${days} day${days > 1 ? 's' : ''}`);

    return result.join(', ');
};

// // Helper function to calculate reward percentages
// const calculateRewardPercentage = (reward, emission) => {
//     return (reward / emission) * 100;
// };

const StakeTimeView = ({ data }) => {

    // Transform and format the incoming data
    data = {
        multiplier_analysis: {
            overall_average: data.multiplier_analysis.overall_average / 1e7,
            capital_average: data.multiplier_analysis.capital_average / 1e7,
            code_average: data.multiplier_analysis.code_average / 1e7
        },
        staker_analysis: {
            average_stake_time: {
                0: formatDaysToYearsMonthsDays(data.staker_analysis.average_stake_time[0]),
                1: formatDaysToYearsMonthsDays(data.staker_analysis.average_stake_time[1])
            },
            combined_average_stake_time: formatDaysToYearsMonthsDays(data.staker_analysis.combined_average_stake_time)
        },
        stakereward_analysis: {
            capital: {
                daily: data.stakereward_analysis[0].daily_reward_sum,
                total: data.stakereward_analysis[0].total_current_user_reward_sum
            },
            code: {
                daily: data.stakereward_analysis[1].daily_reward_sum,
                total: data.stakereward_analysis[1].total_current_user_reward_sum,
            }
        }
    }

    // Define options for the toggle button groups
    const multiplierOptions = [
        { key: 'capital_average', value: 'Capital' },
        { key: 'code_average', value: 'Code' },
        { key: 'overall_average', value: 'Combined' }
    ];

    const stakeTimeOptions = [
        { key: '0', value: 'Capital' },
        { key: '1', value: 'Code' },
        { key: 'combined', value: 'Combined' }
    ];

    const stakeRewardOptions = [
        { key: 'capital', value: 'Capital' },
        { key: 'code', value: 'Code' },
        { key: 'combined', value: 'Combined' },
    ];

    // State hooks for selected options
    const [selectedMultiplier, setSelectedMultiplier] = useState(multiplierOptions[0]);
    const [selectedStakeTime, setSelectedStakeTime] = useState(stakeTimeOptions[0]);
    const [selectedStakeReward, setSelectedStakeReward] = useState(stakeRewardOptions[0]);

    // Helper function to get the multiplier value based on the selected option
    const getMultiplierValue = () => {
        return data.multiplier_analysis[selectedMultiplier.key].toFixed(2);
    }

    // Helper function to get the stake time value based on the selected option
    const getStakeTimeValue = () => {
        if (selectedStakeTime.key === 'combined') {
            return data.staker_analysis.combined_average_stake_time;
        } else {
            return data.staker_analysis.average_stake_time[selectedStakeTime.key];
        }
    }

    // Helper function to get the stake reward value based on the selected option
    const getStakeRewardValue = () => {
        let daily, total;
        switch (selectedStakeReward.key) {
            case 'capital':
                daily = data.stakereward_analysis.capital.daily;
                total = data.stakereward_analysis.capital.total;
                break;
            case 'code':
                daily = data.stakereward_analysis.code.daily;
                total = data.stakereward_analysis.code.total;
                break;
            case 'combined':
                daily = data.stakereward_analysis.capital.daily + data.stakereward_analysis.code.daily;
                total = data.stakereward_analysis.capital.total + data.stakereward_analysis.code.total;
                break;
            default:
                daily = 0;
                total = 0;
        }
        return `${formatNumber(daily.toFixed(2))} / ${formatNumber(total.toFixed(2))}`;
    }

    return (
        <div className="staking_time_main_grid_2">
            {/* Average Multiplier Section */}
            <div className="staking_reward_main_flex">
                <ToggleButtonGroup
                    options={multiplierOptions}
                    selectedOption={selectedMultiplier}
                    setSelectedOption={setSelectedMultiplier}
                    getOptionLabel={(option) => option.value}
                />
                <DataCard
                    title="Average Multiplier"
                    value={getMultiplierValue()}
                    subcontent={null}
                    prefix={null}
                    suffix="x"
                />
            </div>
            {/* Average Stake Time Section */}
            <div className="staking_reward_main_flex">
                <ToggleButtonGroup
                    options={stakeTimeOptions}
                    selectedOption={selectedStakeTime}
                    setSelectedOption={setSelectedStakeTime}
                    getOptionLabel={(option) => option.value}
                />
                <DataCard
                    title="Average Stake Time"
                    value={getStakeTimeValue()}
                    subcontent={null}
                    prefix={null}
                    suffix={null}
                />
            </div>
            {/* MOR Rewards Staked Section */}
            <div className="staking_reward_main_flex">
                <ToggleButtonGroup
                    options={stakeRewardOptions}
                    selectedOption={selectedStakeReward}
                    setSelectedOption={setSelectedStakeReward}
                    getOptionLabel={(option) => option.value}
                />
                <DataCard
                    title={
                        <span>
                            MOR Rewards Staked {' '}
                            <span style={{ color: '#888' }}>(Daily / Total)</span>
                        </span>
                    }
                    value={getStakeRewardValue()}
                    subcontent={null}
                    prefix={null}
                    suffix={null}
                />
            </div>
        </div>
    );
}

export default StakeTimeView;