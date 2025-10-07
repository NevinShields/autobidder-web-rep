import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle2, Clock, FileText, Facebook, MapPin, Target, TrendingUp, Sparkles, History } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SeoCycle, SeoTask, SeoContentIdea } from "@shared/schema";

// Task weights for percentage calculation
const TASK_WEIGHTS = {
  blog: { total: 3, weight: 30 },
  gmb: { total: 3, weight: 25 },
  facebook: { total: 3, weight: 15 },
  location: { total: 10, weight: 30 },
};

export default function SeoTrackerTest() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<SeoTask | null>(null);
  const [proofLink, setProofLink] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState("");

  // Fetch current SEO cycle
  const { data: currentCycle, isLoading: cycleLoading } = useQuery<SeoCycle>({
    queryKey: ['/api/seo/current-cycle'],
  });

  // Fetch tasks for current cycle
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<SeoTask[]>({
    queryKey: ['/api/seo/tasks', currentCycle?.id],
    enabled: !!currentCycle?.id,
  });

  // Fetch content ideas
  const { data: contentIdeas = [] } = useQuery<SeoContentIdea[]>({
    queryKey: ['/api/seo/content-ideas'],
  });

  // Fetch cycle history
  const { data: cycleHistory = [] } = useQuery<SeoCycle[]>({
    queryKey: ['/api/seo/cycles/history'],
  });

  // Start new cycle mutation
  const startCycleMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const response = await apiRequest("POST", "/api/seo/cycles/start", { keywords });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/current-cycle'] });
      toast({ title: "Success", description: "New SEO cycle started!" });
      setNewKeywords("");
    },
  });

  // Mark task complete mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, proofLink }: { taskId: number; proofLink: string }) => {
      const response = await apiRequest("PATCH", `/api/seo/tasks/${taskId}/complete`, { proofLink });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seo/current-cycle'] });
      toast({ title: "Success", description: "Task marked as complete!" });
      setSelectedTask(null);
      setProofLink("");
    },
  });

  // Generate content ideas mutation
  const generateIdeasMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await apiRequest("POST", "/api/seo/content-ideas/generate", { keyword });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/content-ideas'] });
      toast({ title: "Success", description: "Content ideas generated!" });
    },
  });

  // Calculate task counts
  const getTaskCounts = (type: string) => {
    const completed = tasks.filter(t => t.type === type && t.isCompleted).length;
    const total = TASK_WEIGHTS[type as keyof typeof TASK_WEIGHTS].total;
    return { completed, total };
  };

  // Calculate days left
  const getDaysLeft = () => {
    if (!currentCycle) return 0;
    const end = new Date(currentCycle.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (cycleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // No active cycle - show start screen
  if (!currentCycle) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl">Start Your SEO Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                Begin your 30-day SEO cycle and track your progress toward better search rankings!
              </p>
              <div className="space-y-4">
                <Label htmlFor="keywords">Enter your target keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  data-testid="input-keywords"
                  placeholder="e.g., plumbing services, emergency plumber, local plumber"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                />
                <Button
                  data-testid="button-start-cycle"
                  size="lg"
                  onClick={() => {
                    const keywords = newKeywords.split(',').map(k => k.trim()).filter(Boolean);
                    if (keywords.length === 0) {
                      toast({ title: "Error", description: "Please enter at least one keyword", variant: "destructive" });
                      return;
                    }
                    startCycleMutation.mutate(keywords);
                  }}
                  disabled={startCycleMutation.isPending}
                >
                  <Target className="w-5 h-5 mr-2" />
                  Start 30-Day Cycle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">SEO Tracker</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            {getDaysLeft()} days left
          </Badge>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="ideas" data-testid="tab-ideas">
              <Sparkles className="w-4 h-4 mr-2" />
              Content Ideas
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Completion</span>
                    <span className="font-semibold" data-testid="text-progress-percentage">
                      {currentCycle.completionPercentage}%
                    </span>
                  </div>
                  <Progress value={currentCycle.completionPercentage} className="h-3" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCycle.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" data-testid={`badge-keyword-${i}`}>
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blog Posts */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Blog Posts
                    </CardTitle>
                    <Badge>
                      {getTaskCounts('blog').completed}/{getTaskCounts('blog').total}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={(getTaskCounts('blog').completed / getTaskCounts('blog').total) * 100} 
                      className="h-2"
                    />
                    <div className="space-y-2 mt-4">
                      {tasks.filter(t => t.type === 'blog').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                              {task.title || `Blog Post ${tasks.filter(t => t.type === 'blog').indexOf(task) + 1}`}
                            </span>
                          </div>
                          {!task.isCompleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-complete-blog-${task.id}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GMB Posts */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-500" />
                      Google Business Posts
                    </CardTitle>
                    <Badge>
                      {getTaskCounts('gmb').completed}/{getTaskCounts('gmb').total}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={(getTaskCounts('gmb').completed / getTaskCounts('gmb').total) * 100} 
                      className="h-2"
                    />
                    <div className="space-y-2 mt-4">
                      {tasks.filter(t => t.type === 'gmb').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                              {task.title || `GMB Post ${tasks.filter(t => t.type === 'gmb').indexOf(task) + 1}`}
                            </span>
                          </div>
                          {!task.isCompleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-complete-gmb-${task.id}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facebook Posts */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      Facebook Posts
                    </CardTitle>
                    <Badge>
                      {getTaskCounts('facebook').completed}/{getTaskCounts('facebook').total}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={(getTaskCounts('facebook').completed / getTaskCounts('facebook').total) * 100} 
                      className="h-2"
                    />
                    <div className="space-y-2 mt-4">
                      {tasks.filter(t => t.type === 'facebook').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                              {task.title || `Facebook Post ${tasks.filter(t => t.type === 'facebook').indexOf(task) + 1}`}
                            </span>
                          </div>
                          {!task.isCompleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-complete-facebook-${task.id}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Pages */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-500" />
                      Location Landing Pages
                    </CardTitle>
                    <Badge>
                      {getTaskCounts('location').completed}/{getTaskCounts('location').total}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={(getTaskCounts('location').completed / getTaskCounts('location').total) * 100} 
                      className="h-2"
                    />
                    <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
                      {tasks.filter(t => t.type === 'location').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                            )}
                            <span className={task.isCompleted ? "line-through text-gray-500" : ""}>
                              {task.title || `Location Page ${tasks.filter(t => t.type === 'location').indexOf(task) + 1}`}
                            </span>
                          </div>
                          {!task.isCompleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-complete-location-${task.id}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ideas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Idea Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    data-testid="input-keyword-for-ideas"
                    placeholder="Enter keyword to generate ideas"
                    value={selectedKeyword}
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                  />
                  <Button
                    data-testid="button-generate-ideas"
                    onClick={() => {
                      if (!selectedKeyword) {
                        toast({ title: "Error", description: "Please enter a keyword", variant: "destructive" });
                        return;
                      }
                      generateIdeasMutation.mutate(selectedKeyword);
                    }}
                    disabled={generateIdeasMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Ideas
                  </Button>
                </div>

                <div className="space-y-4">
                  {['blog', 'gmb', 'facebook'].map((type) => (
                    <div key={type}>
                      <h3 className="font-semibold mb-2 capitalize">{type === 'gmb' ? 'Google Business' : type} Ideas</h3>
                      <div className="space-y-2">
                        {contentIdeas
                          .filter(idea => idea.type === type)
                          .map((idea) => (
                            <div
                              key={idea.id}
                              data-testid={`idea-${idea.id}`}
                              className={`p-3 bg-gray-50 rounded-lg flex items-center justify-between ${
                                idea.isUsed ? 'opacity-50' : ''
                              }`}
                            >
                              <span className={idea.isUsed ? 'line-through' : ''}>{idea.title}</span>
                              <Badge variant={idea.isUsed ? 'secondary' : 'default'}>
                                {idea.isUsed ? 'Used' : 'Available'}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Cycle History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cycleHistory.map((cycle) => (
                    <Card key={cycle.id} data-testid={`history-cycle-${cycle.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Keywords: {cycle.keywords.join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600" data-testid={`history-percentage-${cycle.id}`}>
                              {cycle.completionPercentage}%
                            </div>
                            <Badge variant={cycle.status === 'completed' ? 'default' : 'secondary'}>
                              {cycle.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {cycleHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No previous cycles yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Complete Task Dialog */}
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Task Complete</DialogTitle>
              <DialogDescription>
                Add a proof link to verify completion of this task
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proof-link">Proof Link (URL)</Label>
                <Input
                  id="proof-link"
                  data-testid="input-proof-link"
                  placeholder="https://..."
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                />
              </div>
              <Button
                data-testid="button-submit-task"
                className="w-full"
                onClick={() => {
                  if (!proofLink) {
                    toast({ title: "Error", description: "Please enter a proof link", variant: "destructive" });
                    return;
                  }
                  if (selectedTask) {
                    completeTaskMutation.mutate({ taskId: selectedTask.id, proofLink });
                  }
                }}
                disabled={completeTaskMutation.isPending}
              >
                Mark Complete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
