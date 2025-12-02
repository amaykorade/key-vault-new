import { db } from '../lib/db';
import { z } from 'zod';

type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';

export const OrganizationSchema = {
  create: z.object({
    name: z.string().min(1, 'Organization name is required'),
    description: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(1, 'Organization name is required').optional(),
    description: z.string().optional(),
  }),
  addMember: z.object({
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  }),
  updateMemberRole: z.object({
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  }),
};

export class OrganizationService {
  // Create organization and make user the owner
  static async createOrganization(userId: string, data: z.infer<typeof OrganizationSchema.create>) {
    // Enforce free plan limits: only 1 organization per user as OWNER
    const subscription = await db.subscription.findFirst({
      where: { userId },
    });

    const plan: SubscriptionPlan = (subscription?.plan as SubscriptionPlan) || 'FREE';

    if (plan === 'FREE') {
      const ownedOrgCount = await db.organization.count({
        where: { ownerId: userId },
      });

      if (ownedOrgCount >= 1) {
        throw new Error(
          'Free plan limit: You can own only 1 organization on the Free plan. Please upgrade your plan to own more organizations.'
        );
      }
    }

    const slug = this.generateSlug(data.name);
    
    return await db.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          ownerId: userId,
        },
      });

      // Create owner membership
      await tx.membership.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      return organization;
    });
  }

  // Get user's organizations
  static async getUserOrganizations(userId: string) {
    return await db.organization.findMany({
      where: {
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get organization by ID with user's role
  static async getOrganizationById(organizationId: string, userId: string) {
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    });

    return organization;
  }

  // Update organization (only owner/admin)
  static async updateOrganization(organizationId: string, userId: string, data: z.infer<typeof OrganizationSchema.update>) {
    // Check if user has permission
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
      throw new Error('Insufficient permissions');
    }

    return await db.organization.update({
      where: { id: organizationId },
      data: {
        ...data,
        slug: data.name ? this.generateSlug(data.name) : undefined,
      },
    });
  }

  // Get organization members
  static async getOrganizationMembers(organizationId: string, userId: string) {
    // Check if user has access to organization
    const userMembership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!userMembership) {
      throw new Error('Access denied');
    }

    return await db.membership.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // Add member to organization
  static async addMember(organizationId: string, ownerId: string, data: z.infer<typeof OrganizationSchema.addMember>) {
    // Check if user is owner/admin
    const membership = await db.membership.findFirst({
      where: {
        userId: ownerId,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions');
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMembership = await db.membership.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    });

    if (existingMembership) {
      throw new Error('User is already a member');
    }

    // Add member
    return await db.membership.create({
      data: {
        userId: user.id,
        organizationId,
        role: data.role,
      },
    });
  }

  // Update member role
  static async updateMemberRole(organizationId: string, memberId: string, ownerId: string, data: z.infer<typeof OrganizationSchema.updateMemberRole>) {
    // Check if user is owner/admin
    const membership = await db.membership.findFirst({
      where: {
        userId: ownerId,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions');
    }

    // Don't allow changing owner role
    const targetMembership = await db.membership.findFirst({
      where: {
        userId: memberId,
        organizationId,
      },
    });

    if (targetMembership?.role === 'OWNER') {
      throw new Error('Cannot change owner role');
    }

    return await db.membership.update({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
      data: {
        role: data.role,
      },
    });
  }

  // Remove member
  static async removeMember(organizationId: string, memberId: string, ownerId: string) {
    // Check if user is owner/admin
    const membership = await db.membership.findFirst({
      where: {
        userId: ownerId,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions');
    }

    // Don't allow removing owner
    const targetMembership = await db.membership.findFirst({
      where: {
        userId: memberId,
        organizationId,
      },
    });

    if (targetMembership?.role === 'OWNER') {
      throw new Error('Cannot remove owner');
    }

    return await db.membership.delete({
      where: {
        userId_organizationId: {
          userId: memberId,
          organizationId,
        },
      },
    });
  }

  // Delete organization (only owner)
  static async deleteOrganization(organizationId: string, userId: string) {
    // Check if user is the owner
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
        role: 'OWNER',
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions');
    }

    // Check if organization exists
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Delete organization (cascade will handle related records)
    return await db.organization.delete({
      where: { id: organizationId },
    });
  }

  // Generate URL-friendly slug
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
