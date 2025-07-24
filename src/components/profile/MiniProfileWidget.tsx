'use client';

import { 
  User,
  Users,
  Heart,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import { useProfile } from '@/contexts/ProfileContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MiniProfileWidgetProps {
  showFullDetails?: boolean;
  className?: string;
}

export function MiniProfileWidget({ showFullDetails = true, className = '' }: MiniProfileWidgetProps) {
  const { 
    profile, 
    preferences,
    getDietaryRestrictions, 
    getHouseholdSize,
    getBudget
  } = useProfile();

  if (!profile || !preferences) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  const dietaryRestrictions = getDietaryRestrictions();
  const weeklyBudget = getBudget('weekly');

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback>
              {profile.fullName?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{profile.fullName}</h4>
            
            {showFullDetails && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Household Size */}
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getHouseholdSize()} {getHouseholdSize() === 1 ? 'persona' : 'personas'}
                </Badge>
                
                {/* Dietary Restrictions */}
                {dietaryRestrictions.length > 0 && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {dietaryRestrictions.length} {dietaryRestrictions.length === 1 ? 'restricción' : 'restricciones'}
                  </Badge>
                )}
                
                {/* Budget */}
                {weeklyBudget > 0 && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${weeklyBudget}/sem
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Link href="/profile">
          <Button size="icon" variant="ghost" className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// Compact version for navigation bars
export function MiniProfileAvatar() {
  const { profile } = useProfile();
  
  if (!profile) {
    return (
      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
    );
  }
  
  return (
    <Link href="/profile">
      <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
        <AvatarImage src={profile.avatarUrl} />
        <AvatarFallback>
          {profile.fullName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}