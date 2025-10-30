import { db } from '../lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { EmailService } from './email';

export const InvitationSchema = {
  create: z.object({
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
    teamRole: z.enum(['LEAD', 'MEMBER']).optional(),
  }),
  accept: z.object({
    name: z.string().optional(),
    password: z.string().optional(),
  })
};

export class InvitationService {
  // Generate a secure invitation token
  private static generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create invitation for organization (and optionally team)
  static async createInvitation(
    organizationId: string,
    invitedById: string,
    data: z.infer<typeof InvitationSchema.create>,
    teamId?: string
  ) {
    // Check if inviter has permission
    const membership = await db.membership.findFirst({
      where: {
        userId: invitedById,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions to send invitations');
    }

    // If team invitation, check team permissions
    if (teamId) {
      const team = await db.team.findFirst({
        where: { id: teamId, organizationId },
        include: {
          members: {
            where: { userId: invitedById },
            select: { role: true },
          },
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const isTeamLead = team.members.some(m => m.role === 'LEAD');
      const canInviteToTeam = membership.role && ['OWNER', 'ADMIN'].includes(membership.role) || isTeamLead;

      if (!canInviteToTeam) {
        throw new Error('Insufficient permissions to invite to this team');
      }
    }

    // Check if user is already a member of the organization
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const existingMembership = await db.membership.findFirst({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });

      if (existingMembership) {
        // If team invitation and user is already org member, just add to team
        if (teamId) {
          const existingTeamMembership = await db.teamMembership.findFirst({
            where: {
              userId: existingUser.id,
              teamId,
            },
          });

          if (existingTeamMembership) {
            throw new Error('User is already a member of this team');
          }

          // Add to team directly
          await db.teamMembership.create({
            data: {
              userId: existingUser.id,
              teamId,
              role: data.teamRole || 'MEMBER',
            },
          });

          return { directlyAdded: true, user: existingUser };
        } else {
          throw new Error('User is already a member of this organization');
        }
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email: data.email,
        organizationId,
        teamId: teamId || null,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create invitation
    const token = this.generateInvitationToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const invitation = await db.invitation.create({
      data: {
        email: data.email,
        organizationId,
        teamId,
        role: data.role,
        teamRole: data.teamRole,
        invitedById,
        token,
        expiresAt,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invitation email
    try {
      console.log(`[Invitation] Attempting to send invitation email to ${invitation.email}`);
      console.log(`[Invitation] Invitation token: ${invitation.token}`);
      console.log(`[Invitation] Organization: ${invitation.organization.name}`);
      console.log(`[Invitation] Team: ${invitation.team?.name || 'None'}`);
      
      await EmailService.sendTeamInvitationEmail({
        inviteeEmail: invitation.email,
        inviterName: invitation.invitedBy.name || invitation.invitedBy.email,
        organizationName: invitation.organization.name,
        teamName: invitation.team?.name,
        role: invitation.role,
        teamRole: invitation.teamRole || undefined,
        invitationToken: invitation.token,
        expiresAt: invitation.expiresAt,
      });
      console.log(`[Invitation] ✅ Email sent successfully to ${invitation.email}`);
    } catch (error) {
      console.error(`[Invitation] ❌ Failed to send email to ${invitation.email}:`, error);
      // Don't fail the invitation creation if email fails
    }

    return invitation;
  }

  // Get invitation by token
  static async getInvitationByToken(token: string) {
    const invitation = await db.invitation.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    return invitation;
  }

  // Accept invitation
  static async acceptInvitation(
    token: string,
    data: z.infer<typeof InvitationSchema.accept>
  ) {
    const invitation = await this.getInvitationByToken(token);

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email: invitation.email },
    });

    const result = await db.$transaction(async (tx) => {
      // Create user if doesn't exist
      if (!user) {
        if (!data.name || !data.password) {
          throw new Error('Name and password are required for new users');
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(data.password, 10);

        user = await tx.user.create({
          data: {
            email: invitation.email,
            name: data.name,
            passwordHash: hashedPassword,
            emailVerifiedAt: new Date(), // Auto-verify invited users
          },
        });
      }

      // Add to organization if not already a member
      const existingMembership = await tx.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      });

      if (!existingMembership) {
        await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        });
      }

      // Add to team if team invitation
      if (invitation.teamId) {
        const existingTeamMembership = await tx.teamMembership.findFirst({
          where: {
            userId: user.id,
            teamId: invitation.teamId,
          },
        });

        if (!existingTeamMembership) {
          await tx.teamMembership.create({
            data: {
              userId: user.id,
              teamId: invitation.teamId,
              role: invitation.teamRole || 'MEMBER',
            },
          });
        }
      }

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      
      return { user: user!, invitation };
    });

    // Send welcome email OUTSIDE the transaction to avoid timeout
    try {
      await EmailService.sendWelcomeEmail(
        result.user.email,
        result.user.name || 'User',
        invitation.organization.name,
        invitation.team?.name
      );
    } catch (error) {
      console.error('[Invitation] Failed to send welcome email:', error);
      // Don't fail the invitation acceptance if email fails
    }

    return result;
  }

  // Get organization invitations
  static async getOrganizationInvitations(organizationId: string, userId: string) {
    // Check if user has access to organization
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return await db.invitation.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get team invitations
  static async getTeamInvitations(teamId: string, userId: string) {
    // Check if user has access to team
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canViewInvitations = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canViewInvitations) {
      throw new Error('Access denied');
    }

    return await db.invitation.findMany({
      where: {
        teamId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Cancel invitation
  static async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await db.invitation.findFirst({
      where: {
        id: invitationId,
        acceptedAt: null,
      },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
              select: { role: true },
            },
          },
        },
        team: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check permissions
    const orgMembership = invitation.organization.memberships[0];
    const teamMembership = invitation.team?.members[0];
    
    const canCancel = 
      invitation.invitedById === userId || // Inviter can cancel
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      (invitation.teamId && teamMembership?.role === 'LEAD');

    if (!canCancel) {
      throw new Error('Insufficient permissions to cancel invitation');
    }

    return await db.invitation.delete({
      where: { id: invitationId },
    });
  }

  // Resend invitation (generate new token and extend expiry)
  static async resendInvitation(invitationId: string, userId: string) {
    const invitation = await db.invitation.findFirst({
      where: {
        id: invitationId,
        acceptedAt: null,
      },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
              select: { role: true },
            },
          },
        },
        team: {
          include: {
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check permissions
    const orgMembership = invitation.organization.memberships[0];
    const teamMembership = invitation.team?.members[0];
    
    const canResend = 
      invitation.invitedById === userId ||
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      (invitation.teamId && teamMembership?.role === 'LEAD');

    if (!canResend) {
      throw new Error('Insufficient permissions to resend invitation');
    }

    // Generate new token and extend expiry
    const newToken = this.generateInvitationToken();
    const newExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const updatedInvitation = await db.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send the invitation email
    try {
      await EmailService.sendTeamInvitationEmail({
        inviteeEmail: updatedInvitation.email,
        inviterName: updatedInvitation.invitedBy.name || updatedInvitation.invitedBy.email,
        organizationName: updatedInvitation.organization.name,
        teamName: updatedInvitation.team?.name,
        role: updatedInvitation.role,
        teamRole: updatedInvitation.teamRole || undefined,
        invitationToken: newToken,
        expiresAt: newExpiresAt,
      });
    } catch (emailError) {
      console.error('Failed to send resend invitation email:', emailError);
      // Don't fail the request if email fails, invitation is already updated
    }

    return updatedInvitation;
  }
}
