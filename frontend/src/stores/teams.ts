import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  Team, 
  UserTeam,
  CreateTeamRequest, 
  UpdateTeamRequest,
  AddTeamMemberRequest,
  UpdateTeamMemberRoleRequest,
  TeamProject,
  AssignProjectToTeamRequest,
  UpdateTeamProjectPermissionsRequest
} from '../types/index';
import { apiService } from '../services/api';

interface TeamState {
  // State
  teams: Team[];
  currentTeam: Team | null;
  userTeams: UserTeam[];
  teamProjects: TeamProject[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchOrganizationTeams: (organizationId: string) => Promise<void>;
  fetchTeamById: (teamId: string) => Promise<void>;
  fetchUserTeams: () => Promise<void>;
  createTeam: (organizationId: string, data: CreateTeamRequest) => Promise<Team>;
  updateTeam: (teamId: string, data: UpdateTeamRequest) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, data: AddTeamMemberRequest) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateTeamMemberRole: (teamId: string, userId: string, data: UpdateTeamMemberRoleRequest) => Promise<void>;
  
  // Project assignment actions
  fetchTeamProjects: (teamId: string) => Promise<void>;
  assignProjectToTeam: (teamId: string, data: AssignProjectToTeamRequest) => Promise<void>;
  removeProjectFromTeam: (teamId: string, projectId: string) => Promise<void>;
  updateTeamProjectPermissions: (teamId: string, projectId: string, data: UpdateTeamProjectPermissionsRequest) => Promise<void>;
  
  clearCurrentTeam: () => void;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>()(
  devtools(
    (set, get) => ({
      // Initial state
      teams: [],
      currentTeam: null,
      userTeams: [],
      teamProjects: [],
      loading: false,
      error: null,

      // Fetch teams in organization
      fetchOrganizationTeams: async (organizationId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.getOrganizationTeams(organizationId);
          set({ teams: response.teams, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch teams';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Fetch team details
      fetchTeamById: async (teamId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.getTeam(teamId);
          set({ currentTeam: response.team, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Fetch user's teams across all organizations
      fetchUserTeams: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.getUserTeams();
          set({ userTeams: response.teams, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch user teams';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Create team
      createTeam: async (organizationId: string, data: CreateTeamRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.createTeam(organizationId, data);
          const newTeam = response.team;
          
          // Add to teams list
          set(state => ({
            teams: [newTeam, ...state.teams],
            loading: false
          }));
          
          return newTeam;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to create team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Update team
      updateTeam: async (teamId: string, data: UpdateTeamRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.updateTeam(teamId, data);
          const updatedTeam = response.team;
          
          // Update in teams list
          set(state => ({
            teams: state.teams.map(team => 
              team.id === teamId ? { ...team, ...updatedTeam } : team
            ),
            currentTeam: state.currentTeam?.id === teamId 
              ? { ...state.currentTeam, ...updatedTeam } 
              : state.currentTeam,
            loading: false
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Delete team
      deleteTeam: async (teamId: string) => {
        set({ loading: true, error: null });
        try {
          await apiService.deleteTeam(teamId);
          
          // Remove from teams list
          set(state => ({
            teams: state.teams.filter(team => team.id !== teamId),
            currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
            loading: false
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to delete team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Add team member
      addTeamMember: async (teamId: string, data: AddTeamMemberRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.addTeamMember(teamId, data);
          const newMembership = response.membership;
          
          // Update current team if it's loaded
          set(state => {
            if (state.currentTeam?.id === teamId) {
              return {
                currentTeam: {
                  ...state.currentTeam,
                  members: [...(state.currentTeam.members || []), newMembership],
                  memberCount: state.currentTeam.memberCount + 1
                },
                loading: false
              };
            }
            
            // Update teams list member count
            return {
              teams: state.teams.map(team => 
                team.id === teamId 
                  ? { ...team, memberCount: team.memberCount + 1 }
                  : team
              ),
              loading: false
            };
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to add team member';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Remove team member
      removeTeamMember: async (teamId: string, userId: string) => {
        set({ loading: true, error: null });
        try {
          await apiService.removeTeamMember(teamId, userId);
          
          // Update current team if it's loaded
          set(state => {
            if (state.currentTeam?.id === teamId) {
              return {
                currentTeam: {
                  ...state.currentTeam,
                  members: state.currentTeam.members?.filter((member: any) => member.user.id !== userId) || [],
                  memberCount: state.currentTeam.memberCount - 1
                },
                loading: false
              };
            }
            
            // Update teams list member count
            return {
              teams: state.teams.map(team => 
                team.id === teamId 
                  ? { ...team, memberCount: Math.max(0, team.memberCount - 1) }
                  : team
              ),
              loading: false
            };
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to remove team member';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Update team member role
      updateTeamMemberRole: async (teamId: string, userId: string, data: UpdateTeamMemberRoleRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.updateTeamMemberRole(teamId, userId, data);
          const updatedMembership = response.membership;
          
          // Update current team if it's loaded
          set(state => {
            if (state.currentTeam?.id === teamId) {
              return {
                currentTeam: {
                  ...state.currentTeam,
                  members: state.currentTeam.members?.map((member: any) => 
                    member.user.id === userId 
                      ? { ...member, role: updatedMembership.role }
                      : member
                  ) || []
                },
                loading: false
              };
            }
            
            return { loading: false };
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update team member role';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Fetch team's assigned projects
      fetchTeamProjects: async (teamId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiService.getTeamProjects(teamId);
          set({ teamProjects: response.projects, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch team projects';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Assign project to team
      assignProjectToTeam: async (teamId: string, data: AssignProjectToTeamRequest) => {
        set({ loading: true, error: null });
        try {
          await apiService.assignProjectToTeam(teamId, data);
          
          // Refresh team projects
          const response = await apiService.getTeamProjects(teamId);
          set({ teamProjects: response.projects, loading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to assign project to team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Remove project from team
      removeProjectFromTeam: async (teamId: string, projectId: string) => {
        set({ loading: true, error: null });
        try {
          await apiService.removeProjectFromTeam(teamId, projectId);
          
          // Remove from local state
          set(state => ({
            teamProjects: state.teamProjects.filter(tp => tp.project.id !== projectId),
            loading: false
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to remove project from team';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Update team project permissions
      updateTeamProjectPermissions: async (teamId: string, projectId: string, data: UpdateTeamProjectPermissionsRequest) => {
        set({ loading: true, error: null });
        try {
          await apiService.updateTeamProjectPermissions(teamId, projectId, data);
          
          // Update local state
          set(state => ({
            teamProjects: state.teamProjects.map(tp => 
              tp.project.id === projectId 
                ? { ...tp, permissions: data.permissions }
                : tp
            ),
            loading: false
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update project permissions';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Clear current team
      clearCurrentTeam: () => {
        set({ currentTeam: null, teamProjects: [] });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'team-store',
    }
  )
);
