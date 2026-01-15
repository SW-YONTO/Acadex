import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Sun, 
  Moon, 
  Palette, 
  RotateCcw, 
  Check 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Theme presets - each has light and dark variant
const colorPresets = [
  { 
    id: 'default', 
    name: 'Default', 
    color: '#171717',
    lightClass: '', 
    darkClass: '' 
  },
  { 
    id: 'forest', 
    name: 'Forest Green', 
    color: '#16a34a',
    lightClass: 'theme-forest-light', 
    darkClass: 'theme-forest-dark' 
  },
  { 
    id: 'purple', 
    name: 'Purple', 
    color: '#7c3aed',
    lightClass: 'theme-purple-light', 
    darkClass: 'theme-purple-dark' 
  },
  { 
    id: 'blue', 
    name: 'Ocean Blue', 
    color: '#2563eb',
    lightClass: 'theme-blue-light', 
    darkClass: 'theme-blue-dark' 
  },
  { 
    id: 'rose', 
    name: 'Rose', 
    color: '#e11d48',
    lightClass: 'theme-rose-light', 
    darkClass: 'theme-rose-dark' 
  },
  { 
    id: 'orange', 
    name: 'Orange', 
    color: '#ea580c',
    lightClass: 'theme-orange-light', 
    darkClass: 'theme-orange-dark' 
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme-mode') === 'dark' || 
           document.documentElement.classList.contains('dark');
  });
  const [activeColorPreset, setActiveColorPreset] = useState(() => {
    return localStorage.getItem('color-preset') || 'default';
  });

  // Apply theme on mount
  useEffect(() => {
    applyTheme(isDark, activeColorPreset);
  }, []);

  const applyTheme = (dark, colorPresetId) => {
    const preset = colorPresets.find(p => p.id === colorPresetId) || colorPresets[0];
    const root = document.documentElement;
    
    // Remove all theme classes (filter out empty strings)
    colorPresets.forEach(p => {
      if (p.lightClass) root.classList.remove(p.lightClass);
      if (p.darkClass) root.classList.remove(p.darkClass);
    });
    
    // Apply dark/light mode
    if (dark) {
      root.classList.add('dark');
      if (preset.darkClass) {
        root.classList.add(preset.darkClass);
      }
    } else {
      root.classList.remove('dark');
      if (preset.lightClass) {
        root.classList.add(preset.lightClass);
      }
    }
    
    // Save to localStorage
    localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
    localStorage.setItem('color-preset', colorPresetId);
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    applyTheme(newDark, activeColorPreset);
  };

  const selectColorPreset = (presetId) => {
    setActiveColorPreset(presetId);
    applyTheme(isDark, presetId);
  };

  const resetToDefault = () => {
    setActiveColorPreset('default');
    setIsDark(false);
    applyTheme(false, 'default');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1">{user?.role || 'Teacher'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark/Light Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
            </div>
            <Switch 
              checked={isDark} 
              onCheckedChange={toggleDarkMode}
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Color Theme</Label>
            <p className="text-sm text-muted-foreground">
              Choose an accent color for buttons, links and highlights
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectColorPreset(preset.id)}
                  className={`
                    relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    hover:shadow-md cursor-pointer
                    ${activeColorPreset === preset.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div 
                    className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="font-medium text-sm">{preset.name}</span>
                  {activeColorPreset === preset.id && (
                    <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-medium">Preview</Label>
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge>Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary" title="Primary" />
                <div className="w-12 h-12 rounded-lg bg-secondary" title="Secondary" />
                <div className="w-12 h-12 rounded-lg bg-accent" title="Accent" />
                <div className="w-12 h-12 rounded-lg bg-muted" title="Muted" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Colors</CardTitle>
          <CardDescription>Preview of chart colors based on your theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 h-8 rounded" style={{ backgroundColor: 'var(--chart-1)' }} />
            <div className="flex-1 h-8 rounded" style={{ backgroundColor: 'var(--chart-2)' }} />
            <div className="flex-1 h-8 rounded" style={{ backgroundColor: 'var(--chart-3)' }} />
            <div className="flex-1 h-8 rounded" style={{ backgroundColor: 'var(--chart-4)' }} />
            <div className="flex-1 h-8 rounded" style={{ backgroundColor: 'var(--chart-5)' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
