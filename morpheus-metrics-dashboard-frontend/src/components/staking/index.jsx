import React, { useState, useEffect } from 'react';
import StakingApyAndDailyReward from './stakingApyAndDailyReward';
import StakeTimeView from './stakeTimeView';
import MorStakingOverview from './morStakingOverview';
import StakingChart from './staking_chart';
import MorRewardsLockedChart from './morRewardsLockedChart';
import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css"

const base_api_url = api_url.base_api_url;

function StakingView() {
    const [stakeTimeData, setStakeTimeData] = useState(null);
    const [morRewardStakeData, setMorRewardStakeData] = useState(null);
    const [morRewardsLockedData, setMorRewardsLockedData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stakersResponse, rewardsLockedResponse] = await Promise.all([
                    fetch(`${base_api_url}/analyze-mor-stakers`),
                    fetch(`${base_api_url}/historical_mor_rewards_locked`)
                ]);

                const [stakersData, rewardsLockedData] = await Promise.all([
                    stakersResponse.json(),
                    rewardsLockedResponse.json()
                ]);

                const stakeTimeData_raw = {
                    multiplier_analysis: stakersData.multiplier_analysis,
                    staker_analysis: {
                        average_stake_time: stakersData.staker_analysis.average_stake_time,
                        combined_average_stake_time: stakersData.staker_analysis.combined_average_stake_time
                    },
                    stakereward_analysis: stakersData.stakereward_analysis,
                    emissionreward_analysis: stakersData.emissionreward_analysis
                };

                const morRewardStakeData_raw = {
                    staker_analysis: stakersData.staker_analysis,
                    stakereward_analysis: stakersData.stakereward_analysis,
                    emissionreward_analysis: stakersData.emissionreward_analysis
                };

                setStakeTimeData(stakeTimeData_raw);
                setMorRewardStakeData(morRewardStakeData_raw);
                setMorRewardsLockedData(rewardsLockedData);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }

    return (
        <div className={`staking-view-container ${isMobile ? 'mobile' : ''}`}>
            {stakeTimeData && <StakeTimeView data={stakeTimeData} />}
            {morRewardStakeData && <MorStakingOverview data={morRewardStakeData} />}
            <StakingApyAndDailyReward />
            {morRewardsLockedData && <MorRewardsLockedChart data={morRewardsLockedData} />}
            <div className="staking-charts">
                <StakingChart />
            </div>
        </div>
    );
}

export default StakingView;