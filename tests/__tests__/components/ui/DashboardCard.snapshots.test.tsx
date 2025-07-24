import React from 'react';
import { render } from '@testing-library/react';
import { DashboardCard } from '@/components/ui/DashboardCard';

// Mock button component for actions
const MockButton = ({ children }: { children: React.ReactNode }) => (
  <button className="mock-button">{children}</button>
);

// Mock content component
const MockContent = ({ title }: { title: string }) => (
  <div className="mock-content">
    <h4>{title}</h4>
    <p>This is mock content for testing.</p>
  </div>
);

describe('DashboardCard Snapshots', () => {
  describe('Basic DashboardCard', () => {
    it('should render basic dashboard card with content only', () => {
      const { container } = render(
        <DashboardCard>
          <MockContent title="Basic Content" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with title', () => {
      const { container } = render(
        <DashboardCard title="Dashboard Title">
          <MockContent title="Content with Title" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with title and subtitle', () => {
      const { container } = render(
        <DashboardCard 
          title="Dashboard Title" 
          subtitle="This is a subtitle"
        >
          <MockContent title="Content with Title and Subtitle" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard with Actions', () => {
    it('should render dashboard card with action button', () => {
      const { container } = render(
        <DashboardCard 
          title="Dashboard Title"
          action={<MockButton>Action</MockButton>}
        >
          <MockContent title="Content with Action" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with action but no title', () => {
      const { container } = render(
        <DashboardCard action={<MockButton>Action</MockButton>}>
          <MockContent title="Content with Action Only" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with multiple actions', () => {
      const { container } = render(
        <DashboardCard 
          title="Dashboard Title"
          action={
            <div className="flex gap-2">
              <MockButton>Edit</MockButton>
              <MockButton>Delete</MockButton>
            </div>
          }
        >
          <MockContent title="Content with Multiple Actions" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard Loading States', () => {
    it('should render loading state', () => {
      const { container } = render(
        <DashboardCard 
          title="Loading Card"
          loading={true}
        >
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render loading state with action', () => {
      const { container } = render(
        <DashboardCard 
          title="Loading Card"
          subtitle="Loading subtitle"
          loading={true}
          action={<MockButton>Action</MockButton>}
        >
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render loading state without title', () => {
      const { container } = render(
        <DashboardCard loading={true}>
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard Error States', () => {
    it('should render error state', () => {
      const { container } = render(
        <DashboardCard 
          title="Error Card"
          error="Failed to load data"
        >
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render error state with action', () => {
      const { container } = render(
        <DashboardCard 
          title="Error Card"
          subtitle="Error subtitle"
          error="Network connection failed"
          action={<MockButton>Retry</MockButton>}
        >
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render error state without title', () => {
      const { container } = render(
        <DashboardCard error="Something went wrong">
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render error state with detailed message', () => {
      const { container } = render(
        <DashboardCard 
          title="Detailed Error"
          error="Unable to connect to the server. Please check your internet connection and try again."
        >
          <MockContent title="This should not be visible" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard Custom Styling', () => {
    it('should render dashboard card with custom className', () => {
      const { container } = render(
        <DashboardCard 
          title="Custom Card"
          className="custom-dashboard-card"
        >
          <MockContent title="Custom styled content" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with multiple custom classes', () => {
      const { container } = render(
        <DashboardCard 
          title="Multi-class Card"
          className="custom-class-1 custom-class-2 border-red-500"
        >
          <MockContent title="Multi-class content" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard Complex Content', () => {
    it('should render dashboard card with complex content structure', () => {
      const { container } = render(
        <DashboardCard 
          title="Complex Card"
          subtitle="With complex content"
          action={<MockButton>View All</MockButton>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium">Metric 1</h5>
                <p className="text-2xl font-bold">123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium">Metric 2</h5>
                <p className="text-2xl font-bold">456</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: 2 minutes ago
            </div>
          </div>
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with list content', () => {
      const { container } = render(
        <DashboardCard 
          title="List Card"
          subtitle="Recent activities"
        >
          <ul className="space-y-2">
            <li className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Activity 1</span>
              <span className="text-sm text-gray-500">2 min ago</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Activity 2</span>
              <span className="text-sm text-gray-500">5 min ago</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Activity 3</span>
              <span className="text-sm text-gray-500">10 min ago</span>
            </li>
          </ul>
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with chart-like content', () => {
      const { container } = render(
        <DashboardCard 
          title="Chart Card"
          subtitle="Performance metrics"
          action={<MockButton>Details</MockButton>}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-semibold">$12,345</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth</span>
              <span className="font-semibold text-green-600">+12%</span>
            </div>
          </div>
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('DashboardCard Edge Cases', () => {
    it('should render dashboard card with empty content', () => {
      const { container } = render(
        <DashboardCard title="Empty Card">
          <div></div>
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with very long title', () => {
      const { container } = render(
        <DashboardCard 
          title="This is a very long title that might wrap to multiple lines or be truncated"
          subtitle="This is also a long subtitle that provides additional context"
        >
          <MockContent title="Long title content" />
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render dashboard card with special characters', () => {
      const { container } = render(
        <DashboardCard 
          title="Special Characters: éñüñ & 中文 🎉"
          subtitle="Testing unicode & emojis"
        >
          <div>Content with special chars: àáâãäåæçèéêë</div>
        </DashboardCard>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});