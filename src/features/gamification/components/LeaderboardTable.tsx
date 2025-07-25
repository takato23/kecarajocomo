'use client';

import { useState } from 'react';
import { Crown, Trophy, Medal, Star, TrendingUp, Users } from 'lucide-react';

import { LeaderboardEntry, LeaderboardType, LeaderboardPeriod } from '../types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  onTypeChange?: (type: LeaderboardType) => void;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  className?: string;
}

export function LeaderboardTable({ 
  entries, 
  currentUserId, 
  type, 
  period, 
  onTypeChange, 
  onPeriodChange, 
  className = '' 
}: LeaderboardTableProps) {
  const [showAll, setShowAll] = useState(false);
  
  const visibleEntries = showAll ? entries : entries.slice(0, 10);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">{rank}</span>;
    }
  };

  const getScoreLabel = (type: LeaderboardType) => {
    switch (type) {
      case LeaderboardType.XP:
        return 'XP';
      case LeaderboardType.POINTS:
        return 'Points';
      case LeaderboardType.ACHIEVEMENTS:
        return 'Achievements';
      case LeaderboardType.STREAKS:
        return 'Best Streak';
      case LeaderboardType.RECIPES_CREATED:
        return 'Recipes';
      case LeaderboardType.MEALS_COOKED:
        return 'Meals';
      default:
        return 'Score';
    }
  };

  const formatScore = (score: number, type: LeaderboardType) => {
    if (type === LeaderboardType.XP || type === LeaderboardType.POINTS) {
      return score.toLocaleString();
    }
    return score.toString();
  };

  const typeOptions = [
    { value: LeaderboardType.XP, label: 'XP', icon: Star },
    { value: LeaderboardType.POINTS, label: 'Points', icon: Trophy },
    { value: LeaderboardType.ACHIEVEMENTS, label: 'Achievements', icon: Medal },
    { value: LeaderboardType.STREAKS, label: 'Streaks', icon: TrendingUp },
    { value: LeaderboardType.RECIPES_CREATED, label: 'Recipes', icon: Users },
    { value: LeaderboardType.MEALS_COOKED, label: 'Meals', icon: Users }
  ];

  const periodOptions = [
    { value: LeaderboardPeriod.DAILY, label: 'Daily' },
    { value: LeaderboardPeriod.WEEKLY, label: 'Weekly' },
    { value: LeaderboardPeriod.MONTHLY, label: 'Monthly' },
    { value: LeaderboardPeriod.ALL_TIME, label: 'All Time' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>
          <div className="text-sm text-gray-500">
            {entries.length} {entries.length === 1 ? 'player' : 'players'}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Type Filter */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            {typeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => onTypeChange?.(option.value)}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
                    ${type === option.value 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-1">
                    <IconComponent className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Period Filter */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPeriodChange?.(option.value)}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
                  ${period === option.value 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {getScoreLabel(type)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleEntries.map((entry) => (
              <tr 
                key={entry.id}
                className={`
                  transition-colors duration-200
                  ${entry.user_id === currentUserId 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {entry.user_avatar ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={entry.user_avatar} 
                          alt={entry.user_name || 'User'} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {(entry.user_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.user_name || 'Anonymous User'}
                        {entry.user_id === currentUserId && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {formatScore(entry.score, type)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More Button */}
      {entries.length > 10 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Show Less' : `Show All ${entries.length} Players`}
          </button>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No leaderboard data available</p>
          <p className="text-sm text-gray-400">
            Start earning {getScoreLabel(type).toLowerCase()} to appear on the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  type: LeaderboardType;
  className?: string;
}

export function LeaderboardPodium({ entries, currentUserId, type, className = '' }: LeaderboardPodiumProps) {
  const topThree = entries.slice(0, 3);
  const [first, second, third] = topThree;

  const getScoreLabel = (type: LeaderboardType) => {
    switch (type) {
      case LeaderboardType.XP:
        return 'XP';
      case LeaderboardType.POINTS:
        return 'Points';
      case LeaderboardType.ACHIEVEMENTS:
        return 'Achievements';
      case LeaderboardType.STREAKS:
        return 'Days';
      case LeaderboardType.RECIPES_CREATED:
        return 'Recipes';
      case LeaderboardType.MEALS_COOKED:
        return 'Meals';
      default:
        return 'Score';
    }
  };

  const formatScore = (score: number, type: LeaderboardType) => {
    if (type === LeaderboardType.XP || type === LeaderboardType.POINTS) {
      return score.toLocaleString();
    }
    return score.toString();
  };

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-center mb-6">
        <Crown className="w-8 h-8 text-yellow-500 mr-2" />
        <h3 className="text-2xl font-bold text-gray-800">Top Players</h3>
      </div>

      <div className="flex items-end justify-center gap-4">
        {/* Second Place */}
        {second && (
          <div className="text-center">
            <div className="bg-gray-200 rounded-lg p-4 mb-2 h-24 flex items-end justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {second.user_name || 'Anonymous'}
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatScore(second.score, type)}
            </div>
            <div className="text-sm text-gray-600">{getScoreLabel(type)}</div>
          </div>
        )}

        {/* First Place */}
        {first && (
          <div className="text-center">
            <div className="bg-yellow-200 rounded-lg p-4 mb-2 h-32 flex items-end justify-center">
              <div className="text-center">
                <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-700">
                  {first.user_name || 'Anonymous'}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-yellow-700">
              {formatScore(first.score, type)}
            </div>
            <div className="text-sm text-yellow-600">{getScoreLabel(type)}</div>
          </div>
        )}

        {/* Third Place */}
        {third && (
          <div className="text-center">
            <div className="bg-amber-200 rounded-lg p-4 mb-2 h-20 flex items-end justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {third.user_name || 'Anonymous'}
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatScore(third.score, type)}
            </div>
            <div className="text-sm text-gray-600">{getScoreLabel(type)}</div>
          </div>
        )}
      </div>
    </div>
  );
}