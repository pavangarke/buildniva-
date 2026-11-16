import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Search,
  FileText,
  MapPin,
  ShieldCheck,
  Layers,
  ArrowRight,
  HardHat,
  Hammer,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  X,
  Phone,
  KeyRound,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { CustomerProject, ConstructionMilestone, Order, MilestoneTask } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { SignInRequired } from '../auth/SignInRequired.js';

interface ProjectTimelineProps {
  initialProjectId?: string;
  onNavigateToOrderTracking?: (order: Order) => void;
  onNavigateToMarketplace?: (category?: string) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  initialProjectId,
  onNavigateToOrderTracking,
  onNavigateToMarketplace,
}) => {
  const { currentUser, showToast, setActiveTrackingOrder, setActiveTab } = useApp();
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'proj_01');
  const [activeProject, setActiveProject] = useState<CustomerProject | null>(null);
  const [projectOrders, setProjectOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'deliveries' | 'tasks'>('timeline');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom Task / Milestone Modal state
  const [newTaskModalOpen, setNewTaskModalOpen] = useState<boolean>(false);
  const [selectedMilestoneForTask, setSelectedMilestoneForTask] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskRole, setNewTaskRole] = useState<string>('Site Supervisor');
  const [newTaskIsMandatory, setNewTaskIsMandatory] = useState<boolean>(false);
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);

  // Expanded milestone details accordion
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    ms_01: false,
    ms_02: true,
    ms_03: true,
  });

  const loadProjectData = async () => {
    if (!currentUser?.id) {
      setProjects([]);
      setActiveProject(null);
      setProjectOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const custId = currentUser.id;
      const projRes = await api.getProjects(custId);
      const fetchedProjects = projRes.projects || [];
      setProjects(fetchedProjects);

      if (fetchedProjects.length === 0) {
        setActiveProject(null);
        setProjectOrders([]);
        setLoading(false);
        return;
      }

      const targetId =
        fetchedProjects.some((p) => p.id === selectedProjectId)
          ? selectedProjectId
          : fetchedProjects[0].id;
      setSelectedProjectId(targetId);

      const detailsRes = await api.getProjectDetails(targetId);
      if (detailsRes.project) {
        setActiveProject(detailsRes.project);
        setProjectOrders(detailsRes.orders || []);
      } else {
        setActiveProject(fetchedProjects[0]);
      }
    } catch (err) {
      console.error('Error fetching project timeline:', err);
      showToast('Error', 'Could not load construction timeline.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [selectedProjectId, currentUser?.id]);

  const toggleTask = async (milestoneId: string, taskId: string) => {
    if (!activeProject) return;
    try {
      const res = await api.toggleMilestoneTask(activeProject.id, milestoneId, taskId);
      setActiveProject(res.project);
      showToast('Task Updated', 'Milestone task completion toggled.', 'success');
    } catch (err: any) {
      showToast('Failed to toggle task', err.message, 'error');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !selectedMilestoneForTask || !newTaskTitle.trim()) return;

    setSubmittingTask(true);
    try {
      const milestone = activeProject.milestones?.find((m) => m.id === selectedMilestoneForTask);
      if (!milestone) return;

      const newTask: MilestoneTask = {
        id: `t_${Date.now()}`,
        title: newTaskTitle.trim(),
        completed: false,
        assignedRole: newTaskRole,
        isMandatoryInspection: newTaskIsMandatory,
      };

      const updatedTasks = [...milestone.tasks, newTask];
      const completedCount = updatedTasks.filter((t) => t.completed).length;
      const progressPercent = Math.round((completedCount / updatedTasks.length) * 100);

      const res = await api.updateMilestone(activeProject.id, milestone.id, {
        tasks: updatedTasks,
        progressPercent,
      });

      setActiveProject(res.project);
      setNewTaskModalOpen(false);
      setNewTaskTitle('');
      showToast('Task Added', 'New quality inspection task logged for milestone.', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not add task', 'error');
    } finally {
      setSubmittingTask(false);
    }
  };

  const toggleMilestoneAccordion = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculations for overall progress metrics
  const milestones = activeProject?.milestones || [];
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const inProgressMilestones = milestones.filter((m) => m.status === 'in_progress').length;
  const overallProgress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((acc, m) => acc + (m.progressPercent || 0), 0) / milestones.length
        )
      : 0;

  const totalTasks = milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
  const completedTasks = milestones.reduce(
    (acc, m) => acc + (m.tasks?.filter((t) => t.completed).length || 0),
    0
  );

  const filteredMilestones = milestones.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchCat = m.category.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchTasks = m.tasks?.some((t) => t.title.toLowerCase().includes(q));
      const matchOrders = m.materials?.some((mat) => mat.productName.toLowerCase().includes(q));
      return matchTitle || matchCat || matchDesc || matchTasks || matchOrders;
    }
    return true;
  });

  // Material delivery schedule sorting
  const deliveryItems = projectOrders
    .map((ord) => {
      const linkedMilestone = milestones.find((m) => m.orderIds?.includes(ord.id));
      return {
        order: ord,
        milestone: linkedMilestone,
        eta: ord.estimatedDeliveryDate || ord.createdAt,
      };
    })
    .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime());

  const getStatusColor = (status: ConstructionMilestone['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'in_progress':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          badge: 'bg-amber-100 text-amber-800 border border-amber-300',
        };
      case 'delayed':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          badge: 'bg-rose-100 text-rose-800 border border-rose-300',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          badge: 'bg-slate-100 text-slate-700 border border-slate-200',
        };
    }
  };

  const formatEtaDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentUser) {
    return (
      <SignInRequired
        title="Sign in to view your Project Timeline"
        description="Track construction milestones, material deliveries, and site inspection tasks for your active projects."
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading construction timeline & delivery milestones...</p>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-[60vh] bg-stone-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <HardHat className="w-10 h-10 text-amber-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">No Construction Projects Yet</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create your first construction site project from your dashboard to track milestones and delivery schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('customer_dashboard')}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Go to Builder Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>Customer Construction Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                Project Construction Timeline
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{activeProject?.siteAddress} (PIN: {activeProject?.sitePincode})</span>
              </p>
            </div>

            {/* Project Switcher & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {projects.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Site:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  if (milestones.length > 0) {
                    setSelectedMilestoneForTask(milestones[1]?.id || milestones[0]?.id || '');
                    setNewTaskModalOpen(true);
                  }
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add QA Inspection Task</span>
              </button>

              <button
                onClick={loadProjectData}
                title="Refresh timeline status"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-4 bg-stone-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Total Build Progress</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {overallProgress}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">
                {completedMilestones} of {milestones.length} Phases Finished
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Task Sign-offs</span>
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {completedTasks}/{totalTasks}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                {totalTasks - completedTasks} Pending Inspection Checkpoints
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Active Deliveries</span>
                <Truck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {projectOrders.length} Orders
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Next arrival: Today 5:30 PM</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Target Handover</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Feb 15, 2027
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Schedule: On Track</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveViewMode('timeline')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeViewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phased Timeline ({milestones.length})
            </button>
            <button
              onClick={() => setActiveViewMode('deliveries')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeViewMode === 'deliveries'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Material Deliveries ({projectOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveViewMode('tasks')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeViewMode === 'tasks'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checklists ({completedTasks}/{totalTasks})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phase or material..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {activeViewMode === 'timeline' && (
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">All Stages</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            )}
          </div>
        </div>

        {/* ================= VIEW 1: PHASED TIMELINE VIEW ================= */}
        {activeViewMode === 'timeline' && (
          <div className="space-y-4">
            {/* Horizontal Timeline Progress Step Indicator */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-x-auto">
              <div className="min-w-[650px] flex items-center justify-between relative">
                {/* Connecting track line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                {milestones.map((m, idx) => {
                  const isDone = m.status === 'completed';
                  const isCurrent = m.status === 'in_progress';
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestoneAccordion(m.id)}
                      className="flex flex-col items-center text-center cursor-pointer group z-10"
                      style={{ width: `${100 / milestones.length}%` }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-xs'
                            : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-slate-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 mt-2 line-clamp-1 max-w-[100px]">
                        {m.title.split(' ')[0]} {m.title.split(' ')[1]}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {m.progressPercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Detailed Milestone Cards */}
            <div className="space-y-4">
              {filteredMilestones.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No construction milestones matched your filter criteria.
                </div>
              ) : (
                filteredMilestones.map((milestone) => {
                  const styles = getStatusColor(milestone.status);
                  const isExpanded = !!expandedMilestones[milestone.id];
                  const linkedOrders = projectOrders.filter((o) =>
                    milestone.orderIds?.includes(o.id)
                  );

                  return (
                    <div
                      key={milestone.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Milestone Header */}
                      <div
                        onClick={() => toggleMilestoneAccordion(milestone.id)}
                        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 hover:bg-stone-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border ${styles.bg}`}
                          >
                            {milestone.phaseOrder}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                                {milestone.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles.badge}`}>
                                {milestone.status.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {milestone.startDate} to {milestone.targetEndDate}
                                </span>
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {milestone.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                              {milestone.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress and quick indicators */}
                        <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                              {milestone.progressPercent}%
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {milestone.tasks.filter((t) => t.completed).length}/{milestone.tasks.length} Checkpoints
                            </div>
                          </div>

                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden shrink-0">
                            <div
                              className={`h-2 rounded-full ${
                                milestone.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-600'
                              }`}
                              style={{ width: `${milestone.progressPercent}%` }}
                            />
                          </div>

                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Section Details */}
                      {isExpanded && (
                        <div className="p-5 bg-stone-50/50 space-y-5 divide-y divide-slate-100">
                          {/* Top Meta: Contractor, Budget, Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <span className="text-[11px] text-slate-400 block font-medium">Contractor Execution</span>
                              <span className="font-bold text-slate-800 mt-0.5 block truncate">
                                {milestone.leadContractor || 'Kulkarni Infra & Turnkey'}
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <span className="text-[11px] text-slate-400 block font-medium">Stage Budget Allocation</span>
                              <div className="flex items-baseline justify-between mt-0.5">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  ₹{(milestone.spentAmount / 1000).toFixed(0)}k spent
                                </span>
                                <span className="text-slate-500 text-[11px] tabular-nums">
                                  of ₹{(milestone.estimatedBudget / 100000).toFixed(1)}L
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <span className="text-[11px] text-slate-400 block font-medium">Quality Compliance</span>
                              <span className="text-emerald-700 font-semibold text-xs mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>IEI Standard Verified</span>
                              </span>
                            </div>
                          </div>

                          {/* Mandatory Tasks & Checklist */}
                          <div className="pt-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                                <span>Quality Audits & Task Checklist</span>
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMilestoneForTask(milestone.id);
                                  setNewTaskModalOpen(true);
                                }}
                                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Inspection Item</span>
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {milestone.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTask(milestone.id, task.id)}
                                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                                    task.completed
                                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="shrink-0">
                                      {task.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <span
                                      className={`font-medium truncate ${
                                        task.completed ? 'line-through text-slate-500' : 'text-slate-800'
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                    {task.isMandatoryInspection && (
                                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded shrink-0">
                                        Mandatory Sign-off
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                                    {task.assignedRole && (
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                        {task.assignedRole}
                                      </span>
                                    )}
                                    {task.completedAt && (
                                      <span className="text-emerald-700 font-medium">
                                        Verified {task.completedAt.split('T')[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Linked Consignments & Material Deliveries */}
                          <div className="pt-4 space-y-2.5">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Required Construction Materials & Active Orders</span>
                            </span>

                            {milestone.materials.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No material batches mapped to this milestone.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {milestone.materials.map((mat, i) => {
                                  const matchingOrder = projectOrders.find((o) => o.id === mat.orderId);
                                  return (
                                    <div
                                      key={i}
                                      className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div>
                                          <div className="font-bold text-slate-900">{mat.productName}</div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            Qty: <span className="font-semibold text-slate-700">{mat.quantityRequired}</span>
                                          </div>
                                        </div>
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            mat.deliveryStatus === 'delivered'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : mat.deliveryStatus === 'in_transit'
                                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {mat.deliveryStatus.replace('_', ' ')}
                                        </span>
                                      </div>

                                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          <span>ETA: {formatEtaDate(mat.expectedDeliveryDate)}</span>
                                        </span>

                                        {mat.deliveryOtp && (
                                          <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                            OTP: {mat.deliveryOtp}
                                          </span>
                                        )}
                                      </div>

                                      {matchingOrder && (
                                        <button
                                          onClick={() => {
                                            setActiveTrackingOrder(matchingOrder);
                                            setActiveTab('orders');
                                          }}
                                          className="w-full mt-1 py-1 px-2 bg-slate-900 hover:bg-amber-600 text-white font-medium text-[11px] rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                          <span>Track Consignment {matchingOrder.orderNumber}</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Inspection Notes */}
                          {milestone.inspectionNotes && (
                            <div className="pt-3 text-xs text-slate-600 flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-700">Supervisor Note: </span>
                                <span>{milestone.inspectionNotes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: MATERIAL DELIVERIES SCHEDULE ================= */}
        {activeViewMode === 'deliveries' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Consignment Delivery Schedule & ETA
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track incoming cement, steel, masonry, and finish batches mapped to your construction phases.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('materials')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Procure More Materials</span>
                </button>
              </div>

              {deliveryItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No material orders are currently scheduled for this site.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {deliveryItems.map(({ order, milestone, eta }) => (
                    <div key={order.id} className="py-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{order.orderNumber}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                order.status === 'out_for_delivery'
                                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                                  : order.status === 'dispatched'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            {milestone && (
                              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Stage {milestone.phaseOrder}: {milestone.title.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Supplier: <span className="font-semibold text-slate-700">{order.vendorName}</span> · Destination: {order.shippingAddress.street}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-slate-900 tabular-nums">
                            ₹{order.grandTotal.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>ETA: {formatEtaDate(eta)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="p-3 bg-stone-50 rounded-lg border border-slate-200/80 space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-700">
                            <span className="font-medium">
                              {it.quantity} {it.unit} · {it.productName}
                            </span>
                            <span className="font-bold tabular-nums">₹{it.totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Logistics Carrier, OTP, and Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                          {order.deliveryAgent && (
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-slate-400" />
                              <span>{order.deliveryAgent.vehicleType} ({order.deliveryAgent.vehicleNumber})</span>
                            </div>
                          )}

                          {order.deliveryAgent?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{order.deliveryAgent.phone}</span>
                            </div>
                          )}

                          {order.deliveryOtp && (
                            <div className="flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Site Gate OTP: {order.deliveryOtp}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActiveTrackingOrder(order);
                            setActiveTab('orders');
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs self-start sm:self-auto flex items-center gap-1"
                        >
                          <span>Live Tracking & Carrier Map</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: QUALITY & TASK CHECKLIST ================= */}
        {activeViewMode === 'tasks' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Comprehensive Site Inspection & Sign-off Register
                </h2>
                <p className="text-xs text-slate-500">
                  Track structural audits, engineer pre-pour approvals, and milestone sign-offs.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedMilestoneForTask(milestones[0]?.id || '');
                  setNewTaskModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Inspection Item</span>
              </button>
            </div>

            <div className="space-y-6">
              {milestones.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                        {m.phaseOrder}
                      </span>
                      <span>{m.title}</span>
                    </span>
                    <span className="text-slate-500 font-normal">
                      {m.tasks.filter((t) => t.completed).length}/{m.tasks.length} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {m.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(m.id, task.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start justify-between gap-2.5 transition-all ${
                          task.completed
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`font-medium ${
                                task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                              {task.assignedRole && <span>Auditor: {task.assignedRole}</span>}
                              {task.completedAt && (
                                <span className="text-emerald-700 font-semibold">
                                  Done {task.completedAt.split('T')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {task.isMandatoryInspection && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded shrink-0">
                            Mandatory
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add QA Inspection Task */}
        {newTaskModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Add Quality Inspection Task
                  </h3>
                </div>
                <button
                  onClick={() => setNewTaskModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Milestone Stage
                  </label>
                  <select
                    value={selectedMilestoneForTask}
                    onChange={(e) => setSelectedMilestoneForTask(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        Stage {m.phaseOrder}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inspection Checkpoint Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Concrete cube compression test 28-day report"
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Auditor / Assigned Responsibility
                  </label>
                  <select
                    value={newTaskRole}
                    onChange={(e) => setNewTaskRole(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Structural Engineer">Structural Engineer</option>
                    <option value="Architect">Architect</option>
                    <option value="Site Supervisor">Site Supervisor</option>
                    <option value="Quantity Surveyor">Quantity Surveyor</option>
                    <option value="Contractor Lead">Contractor Lead</option>
                    <option value="Customer (Owner Inspection)">Customer (Owner Inspection)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mandatoryCheck"
                    checked={newTaskIsMandatory}
                    onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="mandatoryCheck" className="text-slate-700 font-medium">
                    Mark as Mandatory Before Stage Progression
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNewTaskModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTask || !newTaskTitle.trim()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    {submittingTask ? 'Saving...' : 'Add Checkpoint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
