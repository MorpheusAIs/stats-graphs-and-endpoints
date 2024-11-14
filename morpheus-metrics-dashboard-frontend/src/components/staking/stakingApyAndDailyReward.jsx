import React, { useState, useEffect } from 'react';
import { ToggleButtonGroup, DataCard } from '../utils/utils';
import api_url from "./../../config/api_url.json";
import "./../../css/staking/stakingView.css"

const base_api_url = api_url.base_api_url;

function StakingApyAndDailyReward() {
    const [stakingRewardData, setStakingRewardData] = useState(null);
    const [apyOptions, setApyOptions] = useState([]);
    const [morOptions, setMorOptions] = useState([]);
    const [selectedApyOption, setSelectedApyOption] = useState(null);
    const [selectedMorOption, setSelectedMorOption] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/give_mor_reward`);
                const data = await response.json();
                setStakingRewardData(data);

                const options = generateOptions(data.apy_per_steth);
                setApyOptions(options);
                setMorOptions(options);

                setSelectedApyOption(options[0]);
                setSelectedMorOption(options[0]);
                setIsLoading(false);
            } catch (error) {
                setError(error.message);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const generateOptions = (data) => {
        return data.map(item => ({
            key: item.staking_period,
            value: item.staking_period === 0 ? 'No Lock' : `${item.staking_period / 365}Y`
        }));
    }

    const getSelectedData = (type) => {
        if (!stakingRewardData || !selectedApyOption) return null;
        const dataArray = type === 'apy' ? stakingRewardData.apy_per_steth : stakingRewardData.daily_mor_rewards_per_steth;
        const selectedOption = type === 'apy' ? selectedApyOption : selectedMorOption;
        return dataArray.find(item => item.staking_period === selectedOption.key)?.[type === 'apy' ? 'apy' : 'daily_mor_rewards'];
    };

    if (isLoading) return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    if (error) return <div style={{ color: '#FF0000' }}>Error: {error}</div>;

    return (
        <div className="staking_reward_main_grid">
            <RewardCard
                title="APY Per 1 Deposited stETH"
                options={apyOptions}
                selectedOption={selectedApyOption}
                setSelectedOption={setSelectedApyOption}
                value={getSelectedData('apy')}
                // suffix="%"
            />
            <RewardCard
                title="Daily MOR Rewards Accrued per 1 Deposited stETH"
                options={morOptions}
                selectedOption={selectedMorOption}
                setSelectedOption={setSelectedMorOption}
                value={parseFloat(getSelectedData('mor') || 0).toFixed(2)}
            />
        </div>
    );
}

function RewardCard({ title, options, selectedOption, setSelectedOption, value, suffix }) {
    return (
        <div className="staking_reward_main_flex">
            <ToggleButtonGroup
                options={options}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                getOptionLabel={(option) => option.value}
            />
            {value !== null && (
                <DataCard
                    title={title}
                    value={value}
                    subcontent={null}
                    prefix={null}
                    suffix={suffix}
                />
            )}
        </div>
    );
}

export default StakingApyAndDailyReward;