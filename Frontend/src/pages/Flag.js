import React, { useState } from 'react';

// Complete array of country flags and country names using flag CDN
const countryFlags = [
    { name: 'Afghanistan', code: 'AF', flagUrl: 'https://flagcdn.com/w320/af.png' },
    { name: 'Albania', code: 'AL', flagUrl: 'https://flagcdn.com/w320/al.png' },
    { name: 'Algeria', code: 'DZ', flagUrl: 'https://flagcdn.com/w320/dz.png' },
    { name: 'Andorra', code: 'AD', flagUrl: 'https://flagcdn.com/w320/ad.png' },
    { name: 'Angola', code: 'AO', flagUrl: 'https://flagcdn.com/w320/ao.png' },
    { name: 'Antigua and Barbuda', code: 'AG', flagUrl: 'https://flagcdn.com/w320/ag.png' },
    { name: 'Argentina', code: 'AR', flagUrl: 'https://flagcdn.com/w320/ar.png' },
    { name: 'Armenia', code: 'AM', flagUrl: 'https://flagcdn.com/w320/am.png' },
    { name: 'Australia', code: 'AU', flagUrl: 'https://flagcdn.com/w320/au.png' },
    { name: 'Austria', code: 'AT', flagUrl: 'https://flagcdn.com/w320/at.png' },
    { name: 'Azerbaijan', code: 'AZ', flagUrl: 'https://flagcdn.com/w320/az.png' },
    { name: 'Bahamas', code: 'BS', flagUrl: 'https://flagcdn.com/w320/bs.png' },
    { name: 'Bahrain', code: 'BH', flagUrl: 'https://flagcdn.com/w320/bh.png' },
    { name: 'Bangladesh', code: 'BD', flagUrl: 'https://flagcdn.com/w320/bd.png' },
    { name: 'Barbados', code: 'BB', flagUrl: 'https://flagcdn.com/w320/bb.png' },
    { name: 'Belarus', code: 'BY', flagUrl: 'https://flagcdn.com/w320/by.png' },
    { name: 'Belgium', code: 'BE', flagUrl: 'https://flagcdn.com/w320/be.png' },
    { name: 'Belize', code: 'BZ', flagUrl: 'https://flagcdn.com/w320/bz.png' },
    { name: 'Benin', code: 'BJ', flagUrl: 'https://flagcdn.com/w320/bj.png' },
    { name: 'Bhutan', code: 'BT', flagUrl: 'https://flagcdn.com/w320/bt.png' },
    { name: 'Bolivia', code: 'BO', flagUrl: 'https://flagcdn.com/w320/bo.png' },
    { name: 'United States', code: 'US', flagUrl: 'https://flagcdn.com/w320/us.png' },
    { name: 'India', code: 'IN', flagUrl: 'https://flagcdn.com/w320/in.png' },
    { name: 'Canada', code: 'CA', flagUrl: 'https://flagcdn.com/w320/ca.png' },
    { name: 'Brazil', code: 'BR', flagUrl: 'https://flagcdn.com/w320/br.png' },
    { name: 'Germany', code: 'DE', flagUrl: 'https://flagcdn.com/w320/de.png' },
    { name: 'Japan', code: 'JP', flagUrl: 'https://flagcdn.com/w320/jp.png' },
    { name: 'United Kingdom', code: 'GB', flagUrl: 'https://flagcdn.com/w320/gb.png' },
];

const FlagDropdown = () => {
    const [selectedCountry, setSelectedCountry] = useState(countryFlags.find(country => country.code === 'IN')); // Default to India

    const handleSelect = (country) => {
        setSelectedCountry(country);
    };

    return (
        <div>
            <div className="custom-dropdown">
                <div className="dropdown-button" tabIndex="0">
                    <img
                        src={selectedCountry.flagUrl}
                        alt={selectedCountry.code}
                        className="selected-flag"
                    />
                </div>
                <div className="dropdown-content">
                    {countryFlags.map((country) => (
                        <div
                            key={country.code}
                            className={`dropdown-item ${country.code === selectedCountry.code ? 'selected' : ''}`}
                            onClick={() => handleSelect(country)}
                        >
                            <img
                                src={country.flagUrl}
                                alt={country.code}
                                className="flag-icon"
                            />
                            {country.name}
                        </div>
                    ))}
                </div>
                {/* For styling purposes */}
                <style jsx>{`
                    .custom-dropdown {
                        position: relative;
                        display: inline-block;
                        width: 52px;
                        margin-right: 5px;
                    }
                    .dropdown-button {
                        padding: 10px;
                        background-color: #ffffff;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        width: 100%;
                        height: 49px;
                    }
                    .dropdown-button:hover {
                        background-color: #f0f0f0;
                    }
                    .dropdown-button:focus {
                        outline: none;
                    }
                    .selected-flag {
                        width: 30px;
                        height: 20px;
                        margin-right: 10px;
                    }
                    .dropdown-content {
                        display: none;
                        position: absolute;
                        background-color: white;
                        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                        min-width: 100%;
                        z-index: 1;
                        border-radius: 8px;
                        margin-top: 8px;
                        max-height: 250px;
                        overflow-y: auto;
                    }
                    .dropdown-button:focus + .dropdown-content,
                    .dropdown-content:hover {
                        display: block;
                    }
                    .dropdown-item {
                        padding: 10px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        transition: background-color 0.2s ease;
                    }
                    .dropdown-item:hover {
                        background-color: #f0f0f0;
                    }
                    .flag-icon {
                        width: 30px;
                        height: 20px;
                        margin-right: 10px;
                    }
                    .dropdown-item.selected {
                        background-color: #e0e0e0;
                        font-weight: bold;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default FlagDropdown;
