import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GamificationCard } from '@/components/dashboard/GamificationCard';
import { Target, Trophy } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock GlassCard
jest.mock('@/components/dashboard/DashboardLayout', () => ({
  GlassCard: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

describe('GamificationCard', () => {
  const mockAchievements = [
    {
      id: '1',
      title: 'Chef Master',
      description: 'Cook 20 recipes',
      progress: 15,
      maxProgress: 20,
      icon: Trophy,
      color: 'text-yellow-400'
    },
    {
      id: '2',
      title: 'Weekly Planner',
      description: 'Plan all meals for a week',
      progress: 7,
      maxProgress: 7,
      icon: Target,
      color: 'text-purple-400'
    },
  ];

  it('renders with default props', () => {
    render(<GamificationCard />);
    
    expect(screen.getByText('Gamification Progress')).toBeInTheDocument();
    expect(screen.getByText('Keep up the great work!')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Apprentice Chef')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <GamificationCard
        level={5}
        experience={750}
        experienceToNext={1500}
        streak={7}
        achievements={mockAchievements}
      />
    );
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('750 / 1500 XP')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('displays level in circular badge', () => {
    render(<GamificationCard level={3} />);
    
    const levelBadge = screen.getByText('3');
    expect(levelBadge.parentElement).toHaveClass('bg-gradient-to-br', 'from-yellow-400', 'to-orange-500');
  });

  it('shows experience progress bar', () => {
    render(<GamificationCard experience={500} experienceToNext={1000} />);
    
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('500 / 1000 XP')).toBeInTheDocument();
  });

  it('displays streak with flame icon', () => {
    render(<GamificationCard streak={5} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('day streak')).toBeInTheDocument();
  });

  it('renders default achievements', () => {
    render(<GamificationCard />);
    
    expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    expect(screen.getByText('Plan 7 meals')).toBeInTheDocument();
    expect(screen.getByText('Healthy Eater')).toBeInTheDocument();
    expect(screen.getByText('Cook 10 healthy meals')).toBeInTheDocument();
  });

  it('renders custom achievements', () => {
    render(<GamificationCard achievements={mockAchievements} />);
    
    expect(screen.getByText('Chef Master')).toBeInTheDocument();
    expect(screen.getByText('Cook 20 recipes')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
    
    expect(screen.getByText('Weekly Planner')).toBeInTheDocument();
    expect(screen.getByText('Plan all meals for a week')).toBeInTheDocument();
    expect(screen.getByText('7/7')).toBeInTheDocument();
  });

  it('shows achievement progress', () => {
    render(<GamificationCard achievements={mockAchievements} />);
    
    expect(screen.getByText('15/20')).toBeInTheDocument();
    expect(screen.getByText('7/7')).toBeInTheDocument();
  });

  it('renders achievements section title', () => {
    render(<GamificationCard />);
    
    expect(screen.getByText('Active Achievements')).toBeInTheDocument();
  });

  it('applies correct color classes to achievements', () => {
    render(<GamificationCard achievements={mockAchievements} />);
    
    const chefMaster = screen.getByText('Chef Master').parentElement!.parentElement!;
    expect(chefMaster.querySelector('.text-yellow-400')).toBeInTheDocument();
    
    const weeklyPlanner = screen.getByText('Weekly Planner').parentElement!.parentElement!;
    expect(weeklyPlanner.querySelector('.text-purple-400')).toBeInTheDocument();
  });

  it('calculates experience progress correctly', () => {
    const { rerender } = render(<GamificationCard experience={0} experienceToNext={100} />);
    expect(screen.getByText('0 / 100 XP')).toBeInTheDocument();
    
    rerender(<GamificationCard experience={50} experienceToNext={100} />);
    expect(screen.getByText('50 / 100 XP')).toBeInTheDocument();
    
    rerender(<GamificationCard experience={100} experienceToNext={100} />);
    expect(screen.getByText('100 / 100 XP')).toBeInTheDocument();
  });

  it('shows completed achievement with different progress bar color', () => {
    const completedAchievement = [{
      id: '1',
      title: 'Completed',
      description: 'Done',
      progress: 10,
      maxProgress: 10,
      icon: Trophy,
      color: 'text-green-400'
    }];
    
    render(<GamificationCard achievements={completedAchievement} />);
    
    const progressBar = screen.getByText('10/10').parentElement!.parentElement!.querySelector('.h-1\\.5');
    expect(progressBar).toBeInTheDocument();
  });

  it('has hover effect on achievement items', () => {
    render(<GamificationCard achievements={mockAchievements} />);
    
    const achievement = screen.getByText('Chef Master').parentElement!.parentElement!.parentElement!;
    expect(achievement).toHaveClass('hover:bg-white/10');
  });
});