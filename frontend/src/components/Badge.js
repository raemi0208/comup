import React from 'react';
import { FaMedal, FaMapMarkerAlt, FaUserFriends, FaPen } from 'react-icons/fa';

const iconMap = {
    attendance: FaMedal,
    post: FaPen,
    landmark: FaMapMarkerAlt,
    friend: FaUserFriends,
};

export const Badge = ({ name, category, threshold, currentCount }) => {
    const isUnlocked = currentCount >= threshold;
    const IconComponent = iconMap[category] || FaMedal;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px',
            filter: isUnlocked ? 'none' : 'grayscale(100%) brightness(1.5)',
            opacity: isUnlocked ? 1 : 0.4,
            transition: 'all 0.3s ease',
            cursor: 'help'
        }}>
            <div style={{ fontSize: '2.5rem', color: isUnlocked ? '#f59e0b' : '#94a3b8' }}>
                <IconComponent />
            </div>
            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '8px', color: '#475569' }}>{name}</p>
        </div>
    );
};