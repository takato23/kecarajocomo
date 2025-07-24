'use client';

import { useState } from 'react';
import { Calendar, Clock, Trophy, Target, Users, Star, CheckCircle, Play } from 'lucide-react';

import { Challenge, UserChallenge, ChallengeCategory, ChallengeDifficulty } from '../types';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onJoin?: (challengeId: string) => void;
  onViewDetails?: (challenge: Challenge) => void;
  className?: string;
}

export function ChallengeCard({ 
  challenge, 
  userChallenge, 
  onJoin, 
  onViewDetails, 
  className = '' 
}: ChallengeCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  
  const isParticipating = !!userChallenge;
  const isCompleted = userChallenge?.is_completed || false;
  const progress = userChallenge?.progress || 0;
  const maxProgress = userChallenge?.max_progress || challenge.requirements[0]?.target || 100;
  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  const difficultyColors = {
    [ChallengeDifficulty.BEGINNER]: 'from-green-400 to-green-600',
    [ChallengeDifficulty.INTERMEDIATE]: 'from-yellow-400 to-yellow-600',
    [ChallengeDifficulty.ADVANCED]: 'from-orange-400 to-orange-600',
    [ChallengeDifficulty.EXPERT]: 'from-red-400 to-red-600'
  };

  const categoryIcons = {
    [ChallengeCategory.COOKING]: '👨‍🍳',
    [ChallengeCategory.NUTRITION]: '🥗',
    [ChallengeCategory.MEAL_PLANNING]: '📅',
    [ChallengeCategory.PANTRY]: '🏠',
    [ChallengeCategory.SOCIAL]: '👥',
    [ChallengeCategory.SEASONAL]: '🌸',
    [ChallengeCategory.SPECIAL_EVENT]: '🎉'
  };

  const handleJoin = async () => {
    if (isJoining || isParticipating) return;
    
    setIsJoining(true);
    try {
      await onJoin?.(challenge.id);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-md border-2 transition-all duration-300
      ${isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-200'}
      ${isExpired ? 'opacity-75' : ''}
      ${className}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl">
              {challenge.icon || categoryIcons[challenge.category] || '🎯'}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{challenge.name}</h3>
              <p className="text-sm text-gray-600">{challenge.description}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          {isCompleted && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              <span>Completed</span>
            </div>
          )}
          
          {isExpired && (
            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
              Expired
            </div>
          )}
        </div>

        {/* Challenge Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{challenge.duration_days} days</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
          </div>
          
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium text-white
            bg-gradient-to-r ${difficultyColors[challenge.difficulty]}
          `}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </div>
          
          {challenge.is_global && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Global</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress (if participating) */}
      {isParticipating && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {progress}/{maxProgress} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
        <div className="space-y-2">
          {challenge.requirements.slice(0, 3).map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>{req.type.replace(/_/g, ' ')}: {req.target}</span>
            </div>
          ))}
          {challenge.requirements.length > 3 && (
            <div className="text-sm text-gray-500">
              +{challenge.requirements.length - 3} more requirements
            </div>
          )}
        </div>
      </div>

      {/* Rewards & Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{challenge.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>{challenge.points_reward} pts</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isParticipating && !isExpired && (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Join</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={() => onViewDetails?.(challenge)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChallengeGridProps {
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  onJoinChallenge?: (challengeId: string) => void;
  onViewDetails?: (challenge: Challenge) => void;
  className?: string;
}

export function ChallengeGrid({ 
  challenges, 
  userChallenges, 
  onJoinChallenge, 
  onViewDetails, 
  className = '' 
}: ChallengeGridProps) {
  const getUserChallenge = (challengeId: string) => {
    return userChallenges.find(uc => uc.challenge_id === challengeId);
  };

  const activeChallenges = challenges.filter(c => c.is_active && new Date(c.end_date) > new Date());
  const completedChallenges = challenges.filter(c => {
    const userChallenge = getUserChallenge(c.id);
    return userChallenge?.is_completed;
  });

  return (
    <div className={className}>
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Active Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getUserChallenge(challenge.id)}
                onJoin={onJoinChallenge}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getUserChallenge(challenge.id)}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No challenges available</p>
          <p className="text-sm text-gray-400">
            Check back later for new challenges to join!
          </p>
        </div>
      )}
    </div>
  );
}