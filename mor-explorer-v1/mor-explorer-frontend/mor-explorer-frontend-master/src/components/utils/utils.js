

import "./../../css/main.css"
import "./../../css/utils/utils.css"


export const formatNumber = (value) => {
    // Convert to number if it's a string
    const num = typeof value === 'string' ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(num)) {
        return 'Invalid number';
    }

    // Format the number with commas and fix to 2 decimal points
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};


export const formatNumberWithOutDecimal = (value) => {
    // Convert to number if it's a string
    const num = typeof value === 'string' ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(num)) {
        return 'Invalid number';
    }

    // Format the number with commas and fix to 2 decimal points
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};


export const ToggleButtonGroup = ({ options, selectedOption, setSelectedOption }) => {
    return (
        <div className="toggle-group">
            {options.map((option) => (
                <button
                    key={option.key}
                    className={`toggle-button ${selectedOption.key === option.key ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(option)}
                >
                    {option.value}
                </button>
            ))}
        </div>
    );
};

export const DataCard = ({ title, value, subcontent, prefix, suffix, }) => {
    return (
        <div className="main_card">
            <div>
                <section className="card_head">
                    <p className="card-title">{title}</p>
                </section>
                <section className="card_content">
                    <span className="card-text">
                        <h2>
                            {prefix ? prefix : ''} {value} {suffix ? suffix : ''}
                        </h2>
                    </span>
                    {subcontent &&
                        <span className="card-label">
                            {subcontent}
                        </span>}
                </section>
            </div>
        </div>
    )
}