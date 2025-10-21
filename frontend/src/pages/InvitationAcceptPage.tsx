import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { InvitationInfo, AcceptInvitationRequest } from '../types/index';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/auth';

export const InvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if user is already logged in
  const isLoggedIn = !!user;
  const isCorrectUser = user?.email === invitation?.email;

  // Utility functions
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEMBER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24;
  };

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getInvitationByToken(token);
      setInvitation(response.invitation);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!isLoggedIn || !isCorrectUser) {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !invitation) return;

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const acceptData: AcceptInvitationRequest = {};
      
      // Only send name and password if user is not logged in or is different user
      if (!isLoggedIn || !isCorrectUser) {
        acceptData.name = formData.name.trim();
        acceptData.password = formData.password;
      }

      await apiService.acceptInvitation(token, acceptData);
      
      // If user wasn't logged in, log them in automatically
      if (!isLoggedIn) {
        // Note: This would require implementing auto-login after invitation acceptance
        // For now, redirect to login with a success message
        navigate('/login', { 
          state: { 
            message: 'Invitation accepted! Please log in with your new account.',
            email: invitation.email
          }
        });
      } else {
        // User was already logged in, redirect to appropriate page
        if (invitation.team) {
          navigate(`/teams/${invitation.team.id}`);
        } else {
          navigate(`/organizations/${invitation.organization.id}`);
        }
      }
    } catch (error: any) {
      if (error.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        error.response.data.details.forEach((detail: any) => {
          apiErrors[detail.field] = detail.message;
        });
        setFormErrors(apiErrors);
      } else {
        setError(error.response?.data?.error || 'Failed to accept invitation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Invalid Invitation</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <CardTitle className="text-white text-xl">
            You're Invited!
          </CardTitle>
          <p className="text-gray-400 mt-2">
            {invitation.invitedBy.name || invitation.invitedBy.email} has invited you to join
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* Invitation Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization:</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {invitation.organization.name}
                </span>
              </div>
              
              {invitation.team && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Team:</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {invitation.team.name}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Role:</span>
                <div className="flex gap-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                    {invitation.role}
                  </span>
                  {invitation.teamRole && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(invitation.teamRole)}`}>
                      Team {invitation.teamRole}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires:</span>
                <span className={`text-sm font-medium ${isExpiringSoon(invitation.expiresAt) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatDate(invitation.expiresAt)}
                </span>
              </div>
            </div>
          </div>

          {/* User Status */}
          {isLoggedIn && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {isCorrectUser ? (
                  <>You are logged in as <strong>{user.email}</strong>. Click accept to join.</>
                ) : (
                  <>You are logged in as <strong>{user.email}</strong>, but this invitation is for <strong>{invitation.email}</strong>. Please log out and accept the invitation with the correct account.</>
                )}
              </p>
            </div>
          )}

          {/* Form for new users or different users */}
          {(!isLoggedIn || !isCorrectUser) && (
            <form onSubmit={handleAcceptInvitation} className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  error={formErrors.name}
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password (min 8 characters)"
                  error={formErrors.password}
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password *
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  error={formErrors.confirmPassword}
                  disabled={submitting}
                />
              </div>
            </form>
          )}

          {/* Accept Button */}
          <div className="space-y-3">
            {isLoggedIn && isCorrectUser ? (
              <Button
                onClick={handleAcceptInvitation}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            ) : (
              <Button
                onClick={handleAcceptInvitation}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              disabled={submitting}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
