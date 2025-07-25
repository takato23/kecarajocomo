import React from 'react';
import { motion } from 'framer-motion';

interface ProfileSkeletonProps {
  className?: string;
}

const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ className = '' }) => {
  // Shimmer animation component
  const Shimmer = ({ className: shimmerClass = '' }: { className?: string }) => (
    <div className={`relative overflow-hidden ${shimmerClass}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );

  // Header Skeleton
  const HeaderSkeleton = () => (
    <div className="relative mb-6">
      {/* Cover image skeleton */}
      <div className="relative h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl">
        <Shimmer className="h-full w-full" />
      </div>
      
      {/* Avatar skeleton */}
      <div className="absolute bottom-0 left-4 sm:left-6 transform translate-y-1/2">
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-xl border-4 border-black/20">
            <Shimmer className="h-full w-full rounded-full" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl border-2 border-black/20">
            <Shimmer className="h-full w-full rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Name and bio skeleton */}
      <div className="mt-16 sm:mt-20 px-4 sm:px-6">
        <div className="h-8 w-48 bg-white/10 backdrop-blur-xl rounded-lg mb-2">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="h-4 w-32 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  // Overview Section Skeleton
  const OverviewSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl p-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg mb-2">
              <Shimmer className="h-full w-full rounded-lg" />
            </div>
            <div className="h-4 w-20 bg-white/10 rounded-lg mb-1">
              <Shimmer className="h-full w-full rounded-lg" />
            </div>
            <div className="h-3 w-16 bg-white/10 rounded-lg">
              <Shimmer className="h-full w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Dietary Preferences Skeleton
  const DietaryPreferencesSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-40 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl">
              <Shimmer className="h-full w-full rounded-xl" />
            </div>
            <div className="flex-1">
              <div className="h-4 w-24 bg-white/10 rounded-lg mb-1">
                <Shimmer className="h-full w-full rounded-lg" />
              </div>
              <div className="h-3 w-32 bg-white/10 rounded-lg">
                <Shimmer className="h-full w-full rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Household Manager Skeleton
  const HouseholdSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-36 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl p-3">
            <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2">
              <Shimmer className="h-full w-full rounded-full" />
            </div>
            <div className="h-3 w-16 bg-white/10 rounded-lg mx-auto mb-1">
              <Shimmer className="h-full w-full rounded-lg" />
            </div>
            <div className="h-2 w-12 bg-white/10 rounded-lg mx-auto">
              <Shimmer className="h-full w-full rounded-lg" />
            </div>
          </div>
        ))}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border-2 border-dashed border-white/10">
          <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2">
            <Shimmer className="h-full w-full rounded-full" />
          </div>
          <div className="h-3 w-20 bg-white/10 rounded-lg mx-auto">
            <Shimmer className="h-full w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );

  // Cooking Preferences Skeleton
  const CookingPreferencesSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-40 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Skill Level */}
        <div>
          <div className="h-4 w-24 bg-white/10 rounded-lg mb-2">
            <Shimmer className="h-full w-full rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-white/10 rounded-lg">
                <Shimmer className="h-full w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Time Available */}
        <div>
          <div className="h-4 w-32 bg-white/10 rounded-lg mb-2">
            <Shimmer className="h-full w-full rounded-lg" />
          </div>
          <div className="h-10 w-full bg-white/10 rounded-lg">
            <Shimmer className="h-full w-full rounded-lg" />
          </div>
        </div>
        
        {/* Cuisines */}
        <div>
          <div className="h-4 w-36 bg-white/10 rounded-lg mb-2">
            <Shimmer className="h-full w-full rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-white/10 rounded-full">
                <Shimmer className="h-full w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Skeleton
  const SettingsSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-24 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg">
                <Shimmer className="h-full w-full rounded-lg" />
              </div>
              <div>
                <div className="h-4 w-24 bg-white/10 rounded-lg mb-1">
                  <Shimmer className="h-full w-full rounded-lg" />
                </div>
                <div className="h-3 w-32 bg-white/10 rounded-lg">
                  <Shimmer className="h-full w-full rounded-lg" />
                </div>
              </div>
            </div>
            <div className="w-12 h-6 bg-white/10 rounded-full">
              <Shimmer className="h-full w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${className}`}
    >
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HeaderSkeleton />
        <OverviewSkeleton />
        <DietaryPreferencesSkeleton />
        <HouseholdSkeleton />
        <CookingPreferencesSkeleton />
        <SettingsSkeleton />
      </div>
    </motion.div>
  );
};

export default ProfileSkeleton;