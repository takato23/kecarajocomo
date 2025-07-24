'use client';

import { useState } from 'react';
import { 
  Settings, 
  Bell,
  Moon,
  Globe,
  Shield,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  Download,
  Trash2,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SettingsSection() {
  const { profile, updateProfile } = useProfileContext();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    weeklyReports: true,
    newRecipes: false,
    budgetAlerts: true,
    pushNotifications: false,
    emailNotifications: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    shareActivity: false,
    allowAnalytics: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    toast.success('Privacy settings updated');
  };

  const handleExportData = () => {
    // Mock export functionality
    toast.success('Your data export has started. You\'ll receive an email when it\'s ready.');
  };

  const handleDeleteAccount = () => {
    // Mock delete functionality
    setShowDeleteDialog(false);
    toast.error('Account deletion requested. You\'ll receive a confirmation email.');
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-glass-strong" />
          <h2 className="text-lg font-semibold text-glass-strong">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="meal-reminders" className="text-sm font-medium">
                Meal Reminders
              </Label>
              <p className="text-xs text-glass-medium">
                Get notified when it's time to start cooking
              </p>
            </div>
            <Switch
              id="meal-reminders"
              checked={notifications.mealReminders}
              onCheckedChange={() => handleNotificationChange('mealReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports" className="text-sm font-medium">
                Weekly Reports
              </Label>
              <p className="text-xs text-glass-medium">
                Receive your cooking analytics every week
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={notifications.weeklyReports}
              onCheckedChange={() => handleNotificationChange('weeklyReports')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-recipes" className="text-sm font-medium">
                New Recipe Suggestions
              </Label>
              <p className="text-xs text-glass-medium">
                Get notified about recipes you might like
              </p>
            </div>
            <Switch
              id="new-recipes"
              checked={notifications.newRecipes}
              onCheckedChange={() => handleNotificationChange('newRecipes')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budget-alerts" className="text-sm font-medium">
                Budget Alerts
              </Label>
              <p className="text-xs text-glass-medium">
                Alert when approaching weekly budget limit
              </p>
            </div>
            <Switch
              id="budget-alerts"
              checked={notifications.budgetAlerts}
              onCheckedChange={() => handleNotificationChange('budgetAlerts')}
            />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Push Notifications
              </Label>
              <p className="text-xs text-glass-medium">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={notifications.pushNotifications}
              onCheckedChange={() => handleNotificationChange('pushNotifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Notifications
              </Label>
              <p className="text-xs text-glass-medium">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.emailNotifications}
              onCheckedChange={() => handleNotificationChange('emailNotifications')}
            />
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-glass-strong" />
          <h2 className="text-lg font-semibold text-glass-strong">
            Privacy
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-glass-strong mb-3 block">
              Profile Visibility
            </Label>
            <RadioGroup
              value={privacy.profileVisibility}
              onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
            >
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="private" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Private
                    </div>
                    <p className="text-xs text-glass-medium">
                      Only you can see your profile
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="household" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Household Only
                    </div>
                    <p className="text-xs text-glass-medium">
                      Visible to household members
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="public" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </div>
                    <p className="text-xs text-glass-medium">
                      Anyone can see your profile
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-activity" className="text-sm font-medium">
                Share Activity
              </Label>
              <p className="text-xs text-glass-medium">
                Allow others to see your cooking activity
              </p>
            </div>
            <Switch
              id="share-activity"
              checked={privacy.shareActivity}
              onCheckedChange={(checked) => handlePrivacyChange('shareActivity', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics" className="text-sm font-medium">
                Analytics & Improvements
              </Label>
              <p className="text-xs text-glass-medium">
                Help improve the app with anonymous usage data
              </p>
            </div>
            <Switch
              id="analytics"
              checked={privacy.allowAnalytics}
              onCheckedChange={(checked) => handlePrivacyChange('allowAnalytics', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Moon className="w-5 h-5 text-glass-strong" />
          <h2 className="text-lg font-semibold text-glass-strong">
            Appearance
          </h2>
        </div>

        <div>
          <Label className="text-sm font-medium text-glass-strong mb-3 block">
            Theme
          </Label>
          <RadioGroup value={theme} onValueChange={setTheme}>
            <div className="grid grid-cols-3 gap-3">
              <label className="cursor-pointer">
                <RadioGroupItem value="light" className="sr-only" />
                <div className={cn(
                  'p-4 rounded-lg border-2 transition-all text-center',
                  theme === 'light'
                    ? 'border-food-warm bg-food-warm/10'
                    : 'border-white/10 bg-glass-medium'
                )}>
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="text-sm font-medium">Light</div>
                </div>
              </label>
              <label className="cursor-pointer">
                <RadioGroupItem value="dark" className="sr-only" />
                <div className={cn(
                  'p-4 rounded-lg border-2 transition-all text-center',
                  theme === 'dark'
                    ? 'border-food-warm bg-food-warm/10'
                    : 'border-white/10 bg-glass-medium'
                )}>
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="text-sm font-medium">Dark</div>
                </div>
              </label>
              <label className="cursor-pointer">
                <RadioGroupItem value="system" className="sr-only" />
                <div className={cn(
                  'p-4 rounded-lg border-2 transition-all text-center',
                  theme === 'system'
                    ? 'border-food-warm bg-food-warm/10'
                    : 'border-white/10 bg-glass-medium'
                )}>
                  <div className="text-2xl mb-1">💻</div>
                  <div className="text-sm font-medium">System</div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {/* Data & Account */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-glass-strong" />
          <h2 className="text-lg font-semibold text-glass-strong">
            Data & Account
          </h2>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Your Data
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-error-500 hover:text-error-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot
              be undone and all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}