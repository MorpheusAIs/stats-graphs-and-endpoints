import React, { useState } from 'react';
import { ToggleButtonGroup, DataCard, formatNumber } from '../utils/utils';
import "./../../css/staking/stakingView.css"



const CirTotalMCapLPView = ({ marketCapData, positionData }) => {
    const marketCapOptions = [
        { key: 'total_supply_market_cap', value: 'Total Supply Market Cap' },
        { key: 'circulating_supply_market_cap', value: 'Circulating Supply Market Cap' }
    ];

    const positionOptions = [
        { key: 'total_value_usd', value: 'PoL Value USD', title: "Protocol-Owned Liquidity Value USD" },
        { key: 'mor_value', value: 'MOR PoL', title: "Protocol-Owned Liquidity Amount MOR" },
        { key: 'steth_value', value: 'wETH PoL', title: "Protocol-Owned Liquidity Amount stETH" }
    ];

    const [selectedMarketCap, setSelectedMarketCap] = useState(marketCapOptions[0]);
    const [selectedPosition, setSelectedPosition] = useState(positionOptions[0]);

    const getMarketCapValue = () => {
        return formatNumber(marketCapData[selectedMarketCap.key].toFixed(2));
    }

    const getPositionValue = () => {
        return formatNumber(positionData[selectedPosition.key].toFixed(2));
    }

    return (
        <div className="supply_main_grid">
            <div className="supply_main_flex">
                <ToggleButtonGroup
                    options={marketCapOptions}
                    selectedOption={selectedMarketCap}
                    setSelectedOption={setSelectedMarketCap}
                    getOptionLabel={(option) => option.value}
                />
                <DataCard
                    title={selectedMarketCap.value}
                    value={getMarketCapValue()}
                    subcontent={null}
                    prefix="$"
                    suffix={null}
                />
            </div>
            <div className="supply_main_flex">
                <ToggleButtonGroup
                    options={positionOptions}
                    selectedOption={selectedPosition}
                    setSelectedOption={setSelectedPosition}
                    getOptionLabel={(option) => option.value}
                />
                <DataCard
                    title={selectedPosition.title}
                    value={getPositionValue()}
                    // subcontent={selectedPosition.key === 'total_value_usd' ? 'USD' : 'Tokens'}
                    prefix={selectedPosition.key === 'total_value_usd' ? '$' : ''}
                    suffix={null}
                />
            </div>
        </div>
    );
}

export default CirTotalMCapLPView;
