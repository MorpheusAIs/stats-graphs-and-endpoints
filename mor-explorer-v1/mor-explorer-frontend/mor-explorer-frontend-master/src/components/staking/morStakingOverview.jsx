import React, { useState } from 'react';
import CumulativeStakersChart from './cumulativeStakersChart';
import { ToggleButtonGroup, DataCard } from '../utils/utils';
import "./../../css/staking/stakingView.css"

const MorStakingOverview = ({ data }) => {
    const uniqueStakerOptions = [
        { key: 'pool_0', value: 'Capital' },
        { key: 'pool_1', value: 'Code' },
        { key: 'combined', value: 'Combined' }
    ];

    const [selectedUniqueStaker, setSelectedUniqueStaker] = useState(uniqueStakerOptions[0]);

    const getUniqueStakersValue = () => {
        return data.staker_analysis.total_unique_stakers[selectedUniqueStaker.key];
    }

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

        return daily_relative_emission_percentage.toFixed(2);
    }

    const getTotalMorEmittedPercentage = () => {
        let total_relative_emission_percentage = 0
        if (selectedUniqueStaker.key === 'pool_0') {
            total_relative_emission_percentage = (data.stakereward_analysis['0'].total_current_user_reward_sum / data.emissionreward_analysis.total_emissions['Capital Emission']) * 100
        }
        else if (selectedUniqueStaker.key === 'pool_1') {
            total_relative_emission_percentage = (data.stakereward_analysis['1'].total_current_user_reward_sum / data.emissionreward_analysis.total_emissions['Code Emission']) * 100
        }
        else {
            total_relative_emission_percentage = (
                (data.stakereward_analysis['0'].total_current_user_reward_sum + data.stakereward_analysis['1'].total_current_user_reward_sum) /
                (data.emissionreward_analysis.total_emissions['Capital Emission'] + data.emissionreward_analysis.total_emissions['Code Emission'])
            )
                * 100
        }
        return total_relative_emission_percentage.toFixed(2);
    }

    return (
        <div className="mor_staking_overview_main_grid_3">
            <div className="mor_staking_overview_sub_grid_3">
                <div className="staking_reward_main_flex">
                    <ToggleButtonGroup
                        options={uniqueStakerOptions}
                        selectedOption={selectedUniqueStaker}
                        setSelectedOption={setSelectedUniqueStaker}
                        getOptionLabel={(option) => option.value}
                    />
                    <br />
                    <DataCard
                        title="Total Unique Stakers"
                        value={getUniqueStakersValue()}
                        subcontent={null}
                        prefix={null}
                        suffix={null}
                    />
                </div>
                <div className="staking_reward_main_flex">
                    <DataCard
                        title="% Staked to Daily Emitted"
                        value={getDailyMorStakeEmittedPercentage()}
                        subcontent={null}
                        prefix={null}
                        suffix={null}
                    />
                </div>
                <div className="staking_reward_main_flex">
                    <DataCard
                        title="% Staked to Total Emitted"
                        value={getTotalMorEmittedPercentage()}
                        subcontent={null}
                        prefix={null}
                        suffix={null}
                    />
                </div>
            </div>
            <div className="staking_chart_background">
                <h2 className="chartheading">
                    Stakers Over Time Per Pool
                </h2>
                <CumulativeStakersChart data={data.staker_analysis} />
            </div>
        </div>
    );
}

export default MorStakingOverview;