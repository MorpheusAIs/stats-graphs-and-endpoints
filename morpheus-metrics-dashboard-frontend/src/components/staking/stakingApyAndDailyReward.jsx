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
        // Function to fetch data from API
        const fetchData = async () => {
            try {
                const response = await fetch(`${base_api_url}/give_mor_reward`);
                const data = await response.json();
                setStakingRewardData(data);

                // Generate options based on the data
                const apyOptions = generateOptions(data.apy_per_steth);
                const morOptions = generateOptions(data.daily_mor_rewards_per_steth);

                setApyOptions(apyOptions);
                setMorOptions(morOptions);

                // Set initial selected options
                setSelectedApyOption(apyOptions[0]);
                setSelectedMorOption(morOptions[0]);
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

    const getSelectedApyData = () => {
        if (!stakingRewardData || !selectedApyOption) return null;
        return stakingRewardData.apy_per_steth.find(item => item.staking_period === selectedApyOption.key)?.apy;
    };

    const getSelectedMorData = () => {
        if (!stakingRewardData || !selectedMorOption) return null;
        return stakingRewardData.daily_mor_rewards_per_steth.find(item => item.staking_period === selectedMorOption.key)?.daily_mor_rewards;
    };

    const selectedApyRewardData = getSelectedApyData();
    const selectedMorRewardData = getSelectedMorData();


    if (isLoading) {
        return <div style={{ color: '#FFFFFF' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ color: '#FF0000' }}>Error: {error}</div>;
    }


    return (
        <>
            <div className="staking_reward_main_grid">
                <div className="staking_reward_main_flex">
                    <ToggleButtonGroup
                        options={apyOptions}
                        selectedOption={selectedApyOption}
                        setSelectedOption={setSelectedApyOption}
                        getOptionLabel={(option) => option.value}
                    />
                    {selectedApyRewardData && (
                        <DataCard
                            title={"APY Per 1 Deposited stETH"}
                            value={selectedApyRewardData}
                            subcontent={null}
                            prefix={null}
                            suffix={null}
                        />
                    )}
                </div>
                <div>
                    <div className="staking_reward_main_flex">
                        <ToggleButtonGroup
                            options={morOptions}
                            selectedOption={selectedMorOption}
                            setSelectedOption={setSelectedMorOption}
                            getOptionLabel={(option) => option.value}
                        />
                        {selectedMorRewardData && (
                            <DataCard
                                title={"Daily MOR Rewards Accrued per 1 Deposited stETH"}
                                value={parseFloat(selectedMorRewardData).toFixed(2)}
                                subcontent={null}
                                prefix={null}
                                suffix={null}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default StakingApyAndDailyReward;