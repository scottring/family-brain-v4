'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServiceContainer } from '@/lib/services/ClientServiceContainer'
import type { Goal, Project } from '@/lib/services/TaskService'
import type { TablesInsert, TablesUpdate, Enums } from '@/lib/types/database'

export type ProjectWithGoalAndTasks = Project & {
  goals: Goal
  task_count: number
}

export type ProjectFilters = {
  goalId?: string
  status?: Enums<'project_status'>
  priority?: Enums<'priority_level'>
  context?: Enums<'context_type'>
}

export type CreateProjectData = Omit<TablesInsert<'projects'>, 'user_id' | 'id'>
export type UpdateProjectData = TablesUpdate<'projects'>

export function useProjects(filters?: ProjectFilters) {
  const queryClient = useQueryClient()
  const services = getServiceContainer()

  const queryKey = ['projects', filters]

  // Fetch projects with goals and task counts
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await services.taskService.getProjectsWithTaskCounts()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch projects')
      }
      
      let filteredProjects = result.data

      // Apply filters
      if (filters?.goalId) {
        filteredProjects = filteredProjects.filter(p => p.goal_id === filters.goalId)
      }
      if (filters?.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status)
      }
      if (filters?.priority) {
        filteredProjects = filteredProjects.filter(p => p.priority === filters.priority)
      }
      if (filters?.context) {
        filteredProjects = filteredProjects.filter(p => p.context === filters.context)
      }

      return filteredProjects
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch goals for dropdowns
  const {
    data: goals = [],
    isLoading: isGoalsLoading,
  } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const result = await services.taskService.getGoals()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch goals')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const result = await services.taskService.createProject(projectData)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create project')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectData }) => {
      const result = await services.taskService.updateProject(id, updates)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update project')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const result = await services.taskService.deleteProject(projectId)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete project')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Group projects by goal
  const projectsByGoal = projects.reduce((acc, project) => {
    const goalId = project.goal_id
    const goalTitle = project.goals.title
    
    if (!acc[goalId]) {
      acc[goalId] = {
        goal: project.goals,
        projects: []
      }
    }
    
    acc[goalId].projects.push(project)
    return acc
  }, {} as Record<string, { goal: Goal; projects: ProjectWithGoalAndTasks[] }>)

  // Get unique filter options
  const filterOptions = {
    statuses: [...new Set(projects.map(p => p.status))],
    priorities: [...new Set(projects.map(p => p.priority))],
    contexts: [...new Set(projects.map(p => p.context))],
  }

  // Calculate progress metrics
  const metrics = {
    total: projects.length,
    byStatus: projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPriority: projects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalTasks: projects.reduce((sum, project) => sum + project.task_count, 0),
    averageProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
      : 0,
  }

  return {
    // Data
    projects,
    goals,
    projectsByGoal,
    filterOptions,
    metrics,
    
    // Loading states
    isLoading,
    isGoalsLoading,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
    
    // Error states
    error,
    createError: createProject.error,
    updateError: updateProject.error,
    deleteError: deleteProject.error,
    
    // Actions
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    refetch,
  }
}

// Utility hook for a single project
export function useProject(projectId: string) {
  const queryClient = useQueryClient()
  const services = getServiceContainer()

  const {
    data: project,
    isLoading,
    error
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const result = await services.taskService.getProjectsWithGoals()
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch project')
      }
      return result.data.find(p => p.id === projectId)
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
  } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const result = await services.taskService.getTasksForProject(projectId)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch tasks')
      }
      return result.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    project,
    tasks,
    isLoading,
    isTasksLoading,
    error,
    taskCount: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
  }
}