import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Bell, Mail, MessageSquare, Plus, Trash2, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { visitService, Visit, CreateVisitRequest } from "@/services/visitService";
import { auth } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { TimePicker } from "@/components/ui/time-picker";

// Using Visit interface from service instead of Task
// interface Task extends Visit {}

const DayPlanner = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isAddingVisit, setIsAddingVisit] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    reminderType: 'email' as 'email',
    reminderTime: 15,
  });
  const { toast } = useToast();

  // Authentication and data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        loadVisits();
      } else {
        setVisits([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadVisits = async () => {
    try {
      setLoading(true);
      // Load both active and completed visits
      const [activeVisits, completedVisits] = await Promise.all([
        visitService.getVisitsByUser(undefined, 'active'),
        visitService.getVisitsByUser(undefined, 'completed')
      ]);
      
      // Combine and mark them accordingly
      const allVisits = [
        ...activeVisits.map(v => ({ ...v, isCompleted: false })),
        ...completedVisits.map(v => ({ ...v, isCompleted: true }))
      ];
      
      setVisits(allVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
      toast({
        title: "Error",
        description: "Failed to load visits. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to schedule visits",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Combine date and time into ISO string
      const visitDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const visitRequest: CreateVisitRequest = {
        title: formData.title,
        description: formData.description,
        visitDate: visitDateTime.toISOString(),
        reminderType: formData.reminderType,
        reminderTime: formData.reminderTime,
      };

      await visitService.createVisit(visitRequest);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        reminderType: 'email',
        reminderTime: 15,
      });
      setIsAddingVisit(false);
      
      // Reload visits
      await loadVisits();
      
      toast({
        title: "Visit Scheduled",
        description: "Property visit added to your planner with reminder set",
      });
    } catch (error) {
      console.error('Error creating visit:', error);
      toast({
        title: "Error",
        description: "Failed to schedule visit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };



  const deleteVisit = async (visitId: string) => {
    try {
      await visitService.deleteVisit(visitId);
      await loadVisits();
      toast({
        title: "Visit Deleted",
        description: "Visit removed from your planner",
      });
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast({
        title: "Error",
        description: "Failed to delete visit",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter visits based on completion status and time
  const now = new Date();
  const activeVisits = visits.filter(visit => {
    const visitDate = new Date(visit.visitDate);
    return !visit.isCompleted && visitDate > now;
  });
  
  const completedVisits = visits.filter(visit => {
    const visitDate = new Date(visit.visitDate);
    return visit.isCompleted || visitDate <= now;
  });

  // Get visits based on active tab
  const getCurrentVisits = () => {
    return activeTab === 'active' ? activeVisits : completedVisits;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Visit Planner — ShoPROP</title>
        <meta name="description" content="Schedule property visits, set reminders, and track your visit progress with ShoPROP Visit Planner." />
        <link rel="canonical" href="/day-planner" />
      </Helmet>

      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Visit Planner</h1>
          </div>
          <p className="text-muted-foreground">Schedule property visits, set reminders, and track your progress</p>
        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Visit Lists and Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visit Planning Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Active Visit Planning ({activeVisits.length})
                </TabsTrigger>
                <TabsTrigger value="visited" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Visited Planning ({completedVisits.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Visit Lists Content */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-2">Loading visits...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch your visits</p>
                </div>
              ) : getCurrentVisits().length === 0 ? (
                <div className="text-center py-12">
                  {activeTab === 'active' ? (
                    <>
                      <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No active visits scheduled</h3>
                      <p className="text-muted-foreground">Schedule your upcoming property visits using the form on the right</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No visits completed yet</h3>
                      <p className="text-muted-foreground">Visits automatically move here after the scheduled time</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {getCurrentVisits()
                    .sort((a, b) => 
                      activeTab === 'active' 
                        ? new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
                        : new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
                    )
                    .map((visit) => (
                      <Card key={visit.id} className={`transition-all ${
                        activeTab === 'visited' ? 'border-blue-200 bg-blue-50' : 'border-blue-200'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-4 w-4 items-center justify-center rounded-full shadow-sm ${
                                  activeTab === 'visited' ? 'bg-blue-600' : 'bg-primary'
                                }`}>
                                  {activeTab === 'visited' ? (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  ) : (
                                    <MapPin className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold">
                                  {visit.title}
                                </h3>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  {activeTab === 'visited' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Clock className="h-4 w-4" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {activeTab === 'visited' ? 'Visited' : 'Scheduled'}
                                  </span>
                                </div>
                              </div>
                              {visit.description && (
                                <p className="ml-7 text-muted-foreground">
                                  {visit.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 ml-7 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(visit.visitDate)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(visit.visitDate)}
                                </div>
                                {activeTab === 'active' && (
                                  <div className="flex items-center gap-1">
                                    <Bell className="h-4 w-4" />
                                    {visit.reminderTime} min before via {visit.reminderType}
                                  </div>
                                )}
                              </div>
                            </div>
                            {activeTab === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteVisit(visit.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Schedule Button and Form */}
          <div className="space-y-4">
            {/* Schedule New Visit Button */}
            <Button 
              onClick={() => setIsAddingVisit(true)}
              className="gap-2 w-full"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Schedule New Visit
            </Button>

            {/* Add Task Form */}
            {isAddingVisit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Schedule Property Visit
                  </CardTitle>
                  <CardDescription>
                    Plan your property visit and get notified before the appointment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Property/Visit Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Visit Apartment in Downtown"
                        required
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Visit Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Time */}
                    <TimePicker
                      value={formData.time}
                      onChange={(time) => handleInputChange('time', time)}
                      required
                    />

                    {/* Reminder */}
                    <div className="space-y-2">
                      <Label htmlFor="reminderTime">Email Reminder</Label>
                      <Select value={formData.reminderTime.toString()} onValueChange={(value) => handleInputChange('reminderTime', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes before</SelectItem>
                          <SelectItem value="15">15 minutes before</SelectItem>
                          <SelectItem value="30">30 minutes before</SelectItem>
                          <SelectItem value="60">1 hour before</SelectItem>
                          <SelectItem value="120">2 hours before</SelectItem>
                          <SelectItem value="1440">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Visit Details</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Property address, contact person, special notes..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 w-full"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <Calendar className="h-4 w-4" />
                            Schedule Visit
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingVisit(false)}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DayPlanner;