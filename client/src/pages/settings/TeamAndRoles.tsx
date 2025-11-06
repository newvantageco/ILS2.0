/**
 * Team & Roles Management UI
 * 
 * Two-tab interface for managing team members and roles
 * This is the "world-class" UI that makes RBAC easy for tenants
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Plus, Edit, Trash2, Copy, Lock } from 'lucide-react';

// Types
type Role = {
  id: string;
  name: string;
  description?: string;
  is_deletable: boolean;
  is_system_default?: boolean;
  permission_count?: number;
  user_count?: number;
  isPrimary?: boolean;
};

type Permission = {
  id: string;
  key: string;
  name: string;
  description: string;
  planLevel: string;
  category: string;
};

type Category = {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
};

// =====================================================
// TAB 1: TEAM MEMBERS
// =====================================================

function TeamMembersTab() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRolesModal, setShowEditRolesModal] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery<any[]>({ queryKey: ['/api/users'] });
  const { data: roles } = useQuery<{ roles: Role[] }>({ queryKey: ['/api/roles'] });

  if (isLoading) return <div>Loading team members...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-gray-600">Manage users and their roles</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {user.roles?.map((role: any) => (
                      <Badge key={role.id} variant={role.isPrimary ? 'default' : 'secondary'}>
                        {role.name}
                        {role.isPrimary && ' (Primary)'}
                      </Badge>
                    ))}
                    {user.is_owner && (
                      <Badge variant="secondary" className="bg-purple-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.account_status === 'active' ? 'default' : 'secondary'}>
                    {user.account_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user.id);
                      setShowEditRolesModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Roles Modal */}
      {showEditRolesModal && selectedUser && (
        <EditUserRolesModal
          userId={selectedUser}
          onClose={() => {
            setShowEditRolesModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}

// =====================================================
// TAB 2: ROLES
// =====================================================

function RolesTab() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery<{ roles: Role[] }>({ queryKey: ['/api/roles'] });
  const { user } = useAuth();

  if (isLoading) return <div>Loading roles...</div>;

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    } catch (error) {
      alert('Failed to delete role');
    }
  };

  const handleCloneRole = async (roleId: string) => {
    const newName = prompt('Enter name for the new role:');
    if (!newName) return;

    try {
      const res = await fetch(`/api/roles/${roleId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    } catch (error) {
      alert('Failed to clone role');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Roles</h2>
          <p className="text-gray-600">Customize permissions for each role</p>
        </div>
        {user && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Role
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles?.roles?.map((role: any) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{role.name}</h3>
                {role.is_system_default && (
                  <Badge variant="outline" className="mt-1">Default</Badge>
                )}
              </div>
              {!role.is_deletable && (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{role.description}</p>

            <div className="flex gap-4 text-sm text-gray-500 mb-4">
              <div>
                <Users className="w-4 h-4 inline mr-1" />
                {role.user_count} users
              </div>
              <div>
                <Shield className="w-4 h-4 inline mr-1" />
                {role.permission_count} permissions
              </div>
            </div>

            {user && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedRole(role.id);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCloneRole(role.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {role.is_deletable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <EditRoleModal
          roleId={selectedRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// MODALS
// =====================================================

function EditUserRolesModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: userRoles } = useQuery<{ roles: Role[] }>({ queryKey: [`/api/roles/users/${userId}`] });
  const { data: allRoles } = useQuery<{ roles: Role[] }>({ queryKey: ['/api/roles'] });
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string>('');

  useState(() => {
    if (userRoles?.roles) {
      setSelectedRoles(userRoles.roles.map((r: any) => r.id));
      setPrimaryRole(userRoles.roles.find((r: any) => r.isPrimary)?.id || '');
    }
  });

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/roles/users/${userId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleIds: selectedRoles,
          setPrimaryRoleId: primaryRole
        })
      });

      if (!res.ok) throw new Error();

      queryClient.invalidateQueries({ queryKey: [`/api/roles/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onClose();
    } catch (error) {
      alert('Failed to update roles');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {allRoles?.roles?.map((role: any) => (
            <div key={role.id} className="flex items-start gap-3">
              <Checkbox
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedRoles([...selectedRoles, role.id]);
                  } else {
                    setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                    if (primaryRole === role.id) setPrimaryRole('');
                  }
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{role.name}</div>
                <div className="text-sm text-gray-500">{role.description}</div>
                {selectedRoles.includes(role.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrimaryRole(role.id)}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {primaryRole === role.id ? '★ Primary' : 'Set as primary'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleModal({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: roleData } = useQuery<{ role: Role; permissions: Permission[] }>({ queryKey: [`/api/roles/${roleId}`] });
  const { data: allPermissions } = useQuery<{ categories: Category[] }>({ queryKey: ['/api/roles/permissions/all'] });
  const { user } = useAuth();
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useState(() => {
    if (roleData) {
      setName(roleData.role.name);
      setDescription(roleData.role.description || '');
      setSelectedPermissions(roleData.permissions.map((p: any) => p.id));
    }
  });

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          permissionIds: selectedPermissions
        })
      });

      if (!res.ok) throw new Error();

      queryClient.invalidateQueries({ queryKey: [`/api/roles/${roleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      onClose();
    } catch (error) {
      alert('Failed to update role');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role: {roleData?.role.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Senior Optometrist"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this role can do..."
                rows={2}
              />
            </div>
          </div>

          {/* Permissions by Category */}
          <div>
            <h3 className="font-semibold mb-4">Permissions</h3>
            <div className="space-y-6">
              {allPermissions?.categories?.map((category: any) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const categoryPermIds = category.permissions.map((p: any) => p.id);
                        const allSelected = categoryPermIds.every((id: string) => 
                          selectedPermissions.includes(id)
                        );
                        
                        if (allSelected) {
                          setSelectedPermissions(selectedPermissions.filter(
                            id => !categoryPermIds.includes(id)
                          ));
                        } else {
                          setSelectedPermissions([
                            ...selectedPermissions,
                            ...categoryPermIds.filter((id: string) => 
                              !selectedPermissions.includes(id)
                            )
                          ]);
                        }
                      }}
                    >
                      {category.permissions.every((p: any) => 
                        selectedPermissions.includes(p.id)
                      ) ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {category.permissions.map((perm: any) => (
                      <div key={perm.id} className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedPermissions.includes(perm.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, perm.id]);
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter(id => id !== perm.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{perm.name}</span>
                            {perm.planLevel !== 'free' && (
                              <Badge variant="outline" className="text-xs">
                                {perm.planLevel}
                              </Badge>
                            )}
                            {perm.planLevel === 'add_on_analytics' && (
                              <Lock className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{perm.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          permissionIds: selectedPermissions
        })
      });

      if (!res.ok) throw new Error();

      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      onClose();
    } catch (error) {
      alert('Failed to create role');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Junior Optometrist"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role can do..."
              rows={3}
            />
          </div>
          <p className="text-sm text-gray-500">
            💡 Tip: You can add permissions after creating the role
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create Role</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const { data: roles } = useQuery<{ roles: Role[] }>({ queryKey: ['/api/roles'] });

  const handleInvite = async () => {
    // Your user invitation logic here
    alert('User invitation sent!');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Assign Roles</label>
            <div className="space-y-2">
              {roles?.roles?.map((role: any) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles([...selectedRoles, role.id]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                      }
                    }}
                  />
                  <span>{role.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInvite}>Send Invitation</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function TeamAndRolesSettings() {
  const { user } = useAuth();

  // Check if user has permission to view this page
  if (!user) {
    return (
      <div className="p-8 text-center">
        <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we load your information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <TeamMembersTab />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TeamAndRolesSettings;
