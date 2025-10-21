import { Router } from 'express';
import { InvitationService, InvitationSchema } from '../services/invitation';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/email';
import { db } from '../lib/db';

const router = Router();

// Send organization invitation
router.post('/organizations/:organizationId/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const data = InvitationSchema.create.parse(req.body);
    const result = await InvitationService.createInvitation(organizationId, req.user!.id, data);
    
    if ('directlyAdded' in result && result.directlyAdded) {
      res.status(201).json({
        message: 'User was already a member and has been added directly',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      });
    } else {
      const invitation = result as any;
      res.status(201).json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          organization: invitation.organization,
          invitedBy: invitation.invitedBy,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Send organization invitation error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    if (error instanceof Error) {
      const errorMessages = [
        'Insufficient permissions to send invitations',
        'User is already a member of this organization',
        'An invitation has already been sent to this email'
      ];
      if (errorMessages.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send team invitation
router.post('/teams/:teamId/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const data = InvitationSchema.create.parse(req.body);
    
    // Get team's organization ID
    const team = await db.team.findFirst({
      where: { id: teamId },
      select: { organizationId: true },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const result = await InvitationService.createInvitation(
      team.organizationId, 
      req.user!.id, 
      data, 
      teamId
    );
    
    if ('directlyAdded' in result && result.directlyAdded) {
      res.status(201).json({
        message: 'User was already an organization member and has been added to the team directly',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      });
    } else {
      const invitation = result as any;
      res.status(201).json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          teamRole: invitation.teamRole,
          organization: invitation.organization,
          team: invitation.team,
          invitedBy: invitation.invitedBy,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
      });
    }
  } catch (error) {
    console.error('Send team invitation error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    if (error instanceof Error) {
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to invite to this team',
        'User is already a member of this team',
        'An invitation has already been sent to this email'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invitation by token (public endpoint)
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await InvitationService.getInvitationByToken(token);
    
    res.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        teamRole: invitation.teamRole,
        organization: invitation.organization,
        team: invitation.team,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    if (error instanceof Error && error.message === 'Invalid or expired invitation') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation (public endpoint)
router.post('/invitations/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const data = InvitationSchema.accept.parse(req.body);
    const result = await InvitationService.acceptInvitation(token, data);
    
    res.json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: result.invitation.organization,
      team: result.invitation.team,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    if (error instanceof Error) {
      const errorMessages = [
        'Invalid or expired invitation',
        'Name and password are required for new users'
      ];
      if (errorMessages.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization invitations
router.get('/organizations/:organizationId/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const invitations = await InvitationService.getOrganizationInvitations(organizationId, req.user!.id);
    
    res.json({
      invitations: invitations.map((invitation: any) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        teamRole: invitation.teamRole,
        team: invitation.team,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get organization invitations error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team invitations
router.get('/teams/:teamId/invitations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const invitations = await InvitationService.getTeamInvitations(teamId, req.user!.id);
    
    res.json({
      invitations: invitations.map((invitation: any) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        teamRole: invitation.teamRole,
        organization: invitation.organization,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get team invitations error:', error);
    if (error instanceof Error) {
      const errorMessages = ['Team not found', 'Access denied'];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel invitation
router.delete('/invitations/:invitationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { invitationId } = req.params;
    await InvitationService.cancelInvitation(invitationId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Cancel invitation error:', error);
    if (error instanceof Error) {
      const errorMessages = [
        'Invitation not found',
        'Insufficient permissions to cancel invitation'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Invitation not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend invitation
router.post('/invitations/:invitationId/resend', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await InvitationService.resendInvitation(invitationId, req.user!.id);
    
    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        teamRole: invitation.teamRole,
        organization: invitation.organization,
        team: invitation.team,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        updatedAt: invitation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    if (error instanceof Error) {
      const errorMessages = [
        'Invitation not found',
        'Insufficient permissions to resend invitation'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Invitation not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test email configuration (admin only)
router.post('/email/test', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin of any organization (simple check)
    const adminMembership = await db.membership.findFirst({
      where: {
        userId: req.user!.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!adminMembership) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const isConfigured = await EmailService.testEmailConfiguration();
    
    if (isConfigured) {
      res.json({ 
        success: true, 
        message: 'Email configuration is working correctly' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Email configuration is not set up or invalid' 
      });
    }
  } catch (error) {
    console.error('Test email configuration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test email configuration' 
    });
  }
});

export default router;
