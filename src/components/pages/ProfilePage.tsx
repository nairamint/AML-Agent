import { 
  User, 
  Settings, 
  Lock, 
  Bell, 
  Palette, 
  Globe, 
  HelpCircle,
  Edit,
  Shield,
  Key,
  Download,
  Trash2,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function ProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1652471949169-9c587e8898cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU3MzY1OTQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <Button 
              size="sm" 
              className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-primary hover:bg-primary/90 text-white"
            >
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">Sarah Chen</h1>
            <p className="text-lg text-slate-600 mb-2">Senior Compliance Officer</p>
            <p className="text-slate-500 mb-4">RegFinancial Services Ltd</p>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="outline">Premium Plan</Badge>
              <Button variant="outline" size="sm">
                <Edit className="w-3 h-3 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">First Name</label>
                    <Input defaultValue="Sarah" className="glass-input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Last Name</label>
                    <Input defaultValue="Chen" className="glass-input" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email Address</label>
                  <Input defaultValue="sarah.chen@regfinancial.com" className="glass-input" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Job Title</label>
                  <Input defaultValue="Senior Compliance Officer" className="glass-input" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Organization</label>
                  <Input defaultValue="RegFinancial Services Ltd" className="glass-input" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Bio</label>
                  <Textarea 
                    defaultValue="Experienced compliance professional specializing in AML, sanctions, and regulatory risk management."
                    className="glass-input"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-primary hover:bg-primary/90 text-white">Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Industry</label>
                    <Select defaultValue="financial-services">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial-services">Financial Services</SelectItem>
                        <SelectItem value="banking">Banking</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="fintech">FinTech</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Experience Level</label>
                    <Select defaultValue="senior">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                        <SelectItem value="expert">Expert (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Specializations</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['AML/CFT', 'Sanctions', 'KYC/CDD', 'Risk Management', 'Regulatory Reporting'].map((spec) => (
                      <Badge key={spec} variant="secondary" className="cursor-pointer">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Password</p>
                    <p className="text-sm text-slate-600">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-600">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Enabled</Badge>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys & Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Personal API Key</p>
                    <p className="text-sm text-slate-600">For custom integrations and automations</p>
                  </div>
                  <Button variant="outline">Generate Key</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle>Login Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on MacBook Pro', location: 'London, UK', time: '2 hours ago', current: true },
                    { device: 'Safari on iPhone', location: 'London, UK', time: '1 day ago', current: false },
                    { device: 'Chrome on Windows', location: 'London, UK', time: '3 days ago', current: false }
                  ].map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/20">
                      <div>
                        <p className="font-medium text-slate-800">{session.device}</p>
                        <p className="text-sm text-slate-600">{session.location} • {session.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.current && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Current</Badge>
                        )}
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="glass-subtle border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Application Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Dark Mode</p>
                    <p className="text-sm text-slate-600">Switch to dark theme</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Email Notifications</p>
                    <p className="text-sm text-slate-600">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Auto-save Drafts</p>
                    <p className="text-sm text-slate-600">Automatically save work in progress</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Default Language</label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-48 glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Time Zone</label>
                  <Select defaultValue="london">
                    <SelectTrigger className="w-64 glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="london">London (GMT+0)</SelectItem>
                      <SelectItem value="paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="new-york">New York (GMT-5)</SelectItem>
                      <SelectItem value="singapore">Singapore (GMT+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Professional Plan</h3>
                    <p className="text-slate-600">$99/month • Billed annually</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>✓ Unlimited AI navigator access</p>
                  <p>✓ Advanced analytics and reporting</p>
                  <p>✓ Custom navigator creation</p>
                  <p>✓ Priority support</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'Jan 1, 2024', amount: '$99.00', status: 'Paid', invoice: 'INV-2024-001' },
                    { date: 'Dec 1, 2023', amount: '$99.00', status: 'Paid', invoice: 'INV-2023-012' },
                    { date: 'Nov 1, 2023', amount: '$99.00', status: 'Paid', invoice: 'INV-2023-011' }
                  ].map((bill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/20">
                      <div>
                        <p className="font-medium text-slate-800">{bill.date}</p>
                        <p className="text-sm text-slate-600">{bill.invoice}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">{bill.amount}</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{bill.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support">
          <div className="space-y-6">
            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <p className="font-medium">Help Center</p>
                      <p className="text-sm text-slate-600">Browse articles and guides</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <p className="font-medium">Contact Support</p>
                      <p className="text-sm text-slate-600">Get personalized help</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-subtle border-0">
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Export Data</p>
                    <p className="text-sm text-slate-600">Download your account data</p>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="font-medium text-red-800">Delete Account</p>
                    <p className="text-sm text-red-600">Permanently delete your account and data</p>
                  </div>
                  <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}