import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  FileText,
  BookOpen,
  Trophy,
  Calendar,
  FolderOpen,
  StickyNote,
  Megaphone,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  School,
  Layers,
  Sun,
  Moon,
  Palette,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { academyApi, batchApi } from '@/lib/api';

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [academies, setAcademies] = useState([]);
  const [batches, setBatches] = useState({});
  const [openAcademies, setOpenAcademies] = useState({});
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme-mode') || 
             (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
    return 'light';
  });

  useEffect(() => {
    loadAcademiesAndBatches();
  }, []);

  const loadAcademiesAndBatches = async () => {
    try {
      const academiesRes = await academyApi.getAll();
      setAcademies(academiesRes.data || []);
      
      // Load batches for each academy
      const batchesMap = {};
      for (const academy of academiesRes.data || []) {
        try {
          const batchRes = await batchApi.getAll(academy._id);
          batchesMap[academy._id] = batchRes.data || [];
        } catch (e) {
          batchesMap[academy._id] = [];
        }
      }
      setBatches(batchesMap);
    } catch (error) {
      console.error('Error loading academies:', error);
    }
  };

  const toggleAcademy = (academyId) => {
    setOpenAcademies(prev => ({
      ...prev,
      [academyId]: !prev[academyId]
    }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Get current color preset
    const colorPreset = localStorage.getItem('color-preset') || 'default';
    const root = document.documentElement;
    
    // Apply dark/light class
    root.classList.toggle('dark', newTheme === 'dark');
    
    // Apply color preset class
    const themeClasses = {
      'forest': { light: 'theme-forest-light', dark: 'theme-forest-dark' },
      'purple': { light: 'theme-purple-light', dark: 'theme-purple-dark' },
      'blue': { light: 'theme-blue-light', dark: 'theme-blue-dark' },
      'rose': { light: 'theme-rose-light', dark: 'theme-rose-dark' },
      'orange': { light: 'theme-orange-light', dark: 'theme-orange-dark' },
    };
    
    // Remove all theme classes first
    Object.values(themeClasses).forEach(tc => {
      root.classList.remove(tc.light, tc.dark);
    });
    
    // Apply preset if not default
    if (colorPreset !== 'default' && themeClasses[colorPreset]) {
      const presetClass = newTheme === 'dark' 
        ? themeClasses[colorPreset].dark 
        : themeClasses[colorPreset].light;
      root.classList.add(presetClass);
    }
    
    localStorage.setItem('theme-mode', newTheme);
  };

  const isActive = (path) => location.pathname === path;
  const isBatchActive = (batchId) => location.pathname === `/batch/${batchId}`;

  const mainNavItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  ];

  const academicsItems = [
    { title: 'Students', icon: Users, path: '/students' },
    { title: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
    { title: 'Test Results', icon: FileText, path: '/results' },
    { title: 'Syllabus', icon: BookOpen, path: '/syllabus' },
    { title: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  ];

  const otherItems = [
    { title: 'Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Documents', icon: FolderOpen, path: '/documents' },
    { title: 'Notes', icon: StickyNote, path: '/notes' },
    { title: 'Announcements', icon: Megaphone, path: '/announcements' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },

  ];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Academy</h2>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-8 w-8"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Academics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Academics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Academies with Batches Dropdown */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isActive('/academies')}>
                      <School className="h-4 w-4" />
                      <span>Academies</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* All Academies Link */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive('/academies')}>
                          <Link to="/academies">
                            <Layers className="h-3 w-3" />
                            <span>All Academies</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      
                      {/* Individual Academies with their Batches */}
                      {academies.map((academy) => (
                        <Collapsible key={academy._id}>
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton 
                                onClick={() => toggleAcademy(academy._id)}
                                className="cursor-pointer"
                              >
                                <School className="h-3 w-3" />
                                <span className="truncate">{academy.name}</span>
                                {batches[academy._id]?.length > 0 && (
                                  <ChevronDown 
                                    className={`ml-auto h-3 w-3 transition-transform ${
                                      openAcademies[academy._id] ? 'rotate-180' : ''
                                    }`} 
                                  />
                                )}
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {batches[academy._id]?.map((batch) => (
                                <SidebarMenuSubButton 
                                  key={batch._id} 
                                  asChild 
                                  isActive={isBatchActive(batch._id)}
                                  className="pl-8"
                                >
                                  <Link to={`/batch/${batch._id}`}>
                                    <Layers className="h-3 w-3" />
                                    <span className="truncate">{batch.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              ))}
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Other Academic Items */}
              {academicsItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Other Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">{user?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role || 'teacher'}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
