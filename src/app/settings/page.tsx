
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Text, Settings as SettingsIcon } from 'lucide-react'; // Changed TextSize to Text

const FONT_SCALE_CLASS = 'text-scale-large';
const FONT_SCALE_STORAGE_KEY = 'settingsFontSizeLargeEnabled';
const HISTORY_STORAGE_KEY = 'chartSightAnalysesHistory';

export default function SettingsPage() {
  const { toast } = useToast();
  const [largerTextEnabled, setLargerTextEnabled] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem(FONT_SCALE_STORAGE_KEY) === 'true';
      setLargerTextEnabled(savedPreference);
      if (savedPreference) {
        document.documentElement.classList.add(FONT_SCALE_CLASS);
      } else {
        document.documentElement.classList.remove(FONT_SCALE_CLASS);
      }
    }
  }, []);

  const handleToggleLargerText = (enabled: boolean) => {
    setLargerTextEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(enabled));
      if (enabled) {
        document.documentElement.classList.add(FONT_SCALE_CLASS);
      } else {
        document.documentElement.classList.remove(FONT_SCALE_CLASS);
      }
      toast({
        title: 'Appearance Updated',
        description: `Larger text ${enabled ? 'enabled' : 'disabled'}.`,
      });
    }
  };

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      toast({
        title: 'History Cleared',
        description: 'Your analysis history has been successfully cleared.',
      });
      setShowConfirmDeleteDialog(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-2 md:px-0 max-w-2xl space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Text className="mr-2 h-5 w-5" /> {/* Changed TextSize to Text */}
            Appearance
          </CardTitle>
          <CardDescription>
            Adjust how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
            <Label htmlFor="larger-text-switch" className="font-medium">
              Enable Larger Text
            </Label>
            <Switch
              id="larger-text-switch"
              checked={largerTextEnabled}
              onCheckedChange={handleToggleLargerText}
              aria-label="Toggle larger text"
            />
          </div>
           <p className="text-xs text-muted-foreground px-1">
            Increases the base font size across the application for better readability.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your application data and history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Analysis History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your
                  locally stored analysis history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>
                  Yes, delete history
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            This will remove all entries from your analysis history page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
