import React, { useState, useEffect } from 'react';
import StakingApyAndDailyReward from './stakingApyAndDailyReward';
import StakeTimeView from './stakeTimeView';
import MorStakingOverview from './morStakingOverview';
import StakingChart from './staking_chart';
import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css"

const base_api_url = api_url.base_api_url;

function StakingView() {
    const [stakeTimeData, setStakeTimeData] = useState(null);
    const [morRewardStakeData, setMorRewardStakeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/analyze-mor-stakers`);
                const data = await response.json();

                const stakeTimeData_raw = {
                    multiplier_analysis: data.multiplier_analysis,
                    staker_analysis: {
                        average_stake_time: data.staker_analysis.average_stake_time,
                        combined_average_stake_time: data.staker_analysis.combined_average_stake_time
                    },
                    stakereward_analysis: data.stakereward_analysis,
                    emissionreward_analysis: data.emissionreward_analysis
                }

                const morRewardStakeData_raw = {
                    staker_analysis: data.staker_analysis,
                    stakereward_analysis: data.stakereward_analysis,
                    emissionreward_analysis: data.emissionreward_analysis
                }

                setStakeTimeData(stakeTimeData_raw)
                setMorRewardStakeData(morRewardStakeData_raw)
                setIsLoading(false);

            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData()
    }, []);

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    return (
        <div className="staking-view-container">
            {stakeTimeData && <StakeTimeView data={stakeTimeData} />}
            {morRewardStakeData && <MorStakingOverview data={morRewardStakeData} />}
            <StakingApyAndDailyReward />
            <StakingChart />
        </div>
    );
}

export default StakingView;