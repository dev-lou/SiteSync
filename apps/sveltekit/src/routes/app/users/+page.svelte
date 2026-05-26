<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Badge from '$ui/Badge.svelte';
  import DataTable from '$ui/DataTable.svelte';
  import Modal from '$ui/Modal.svelte';
  import Input from '$ui/Input.svelte';
  import Select from '$ui/Select.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import { addToast } from '$stores/toast';
  import { useConvexQuery } from '$stores/convex-query.svelte';
  import { mutation } from '$utils/convex-types';
  import { roleLabels, type UserRole } from '$design/tokens';
  import { Users, Shield, UserMinus, UserPlus, RefreshCw } from '@lucide/svelte';

  const currentRole = $derived($page.data.user?.role || '');
  const currentUser = $derived($page.data.user);

  const usersQuery = $derived(useConvexQuery('users:list', {}));

  const users = $derived(usersQuery?.data || []);
  const loading = $derived(usersQuery?.loading ?? true);

  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let selectedUser = $state<Record<string, unknown> | null>(null);

  let newUser = $state({ name: '', email: '', role: 'field_engineer' as UserRole });
  let editRole = $state<UserRole>('field_engineer');
  let actionLoading = $state(false);

  const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
  ];

  async function createUser() {
    actionLoading = true;
    const userName = newUser.name;
    try {
      await mutation('users:createUser', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: true,
      });
      showCreateModal = false;
      newUser = { name: '', email: '', role: 'field_engineer' };
      addToast('success', `User ${userName} created successfully`);
    } catch (err) {
      addToast('error', `Failed: ${(err as Error).message}`);
    } finally {
      actionLoading = false;
    }
  }

  async function updateRole() {
    if (!selectedUser) return;
    actionLoading = true;
    try {
      await mutation('users:updateRole', {
        userId: selectedUser._id as string,
        newRole: editRole,
      });
      showEditModal = false;
      addToast('success', `Role updated to ${roleLabels[editRole]}`);
    } catch (err) {
      addToast('error', `Failed: ${(err as Error).message}`);
    } finally {
      actionLoading = false;
    }
  }

  async function deactivateUser(userId: string) {
    if (!confirm('Deactivate this user? They will lose access immediately.')) return;
    try {
      await mutation('users:deactivateUser', { userId });
      addToast('success', 'User deactivated');
    } catch (err) {
      addToast('error', `Failed: ${(err as Error).message}`);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">User Management</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manage users, roles, and permissions across projects
      </p>
    </div>
    {#if currentRole === 'admin'}
      <Button onclick={() => (showCreateModal = true)}>
        <UserPlus class="h-4 w-4" />
        <span>Add User</span>
      </Button>
    {/if}
  </div>

  {#if currentRole !== 'admin'}
    <Card padding="lg">
      <div class="flex items-center gap-3">
        <Shield class="h-5 w-5 text-warning" />
        <p class="text-sm text-muted-foreground">Admin access required to manage users.</p>
      </div>
    </Card>
  {:else if loading}
    <div class="space-y-2">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
    </div>
  {:else}
    <Card>
      <DataTable
        {columns}
        data={users}
        searchable
        emptyMessage="No users found."
        onrowclick={(row) => {
          selectedUser = row;
          editRole = (row.role as UserRole) || 'field_engineer';
          showEditModal = true;
        }}
      />
    </Card>

    <!-- Role distribution -->
    <Card padding="lg">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Role Distribution
      </h3>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {#each Object.entries(roleLabels) as [role, label]}
          {@const count = (users as Array<Record<string, unknown>>).filter(
            (u) => u.role === role,
          ).length}
          <div class="rounded-md border border-border p-3 text-center">
            <p class="text-lg font-bold">{count}</p>
            <p class="text-xs text-muted-foreground">{label}</p>
          </div>
        {/each}
      </div>
    </Card>
  {/if}
</div>

<!-- Create User Modal -->
<Modal bind:open={showCreateModal} title="Add User">
  <div class="space-y-4">
    <Input label="Name" bind:value={newUser.name} placeholder="Full name" required />
    <Input
      label="Email"
      type="email"
      bind:value={newUser.email}
      placeholder="user@example.com"
      required
    />
    <Select
      label="Role"
      options={roleOptions}
      value={newUser.role}
      onchange={(val: string) => (newUser.role = val as UserRole)}
    />
    <Button onclick={createUser} loading={actionLoading}>
      <UserPlus class="h-4 w-4" />
      <span>Create User</span>
    </Button>
  </div>
</Modal>

<!-- Edit User Modal -->
<Modal bind:open={showEditModal} title={(selectedUser?.name as string) || 'Edit User'}>
  {#if selectedUser}
    <div class="space-y-4">
      <div class="rounded-md border border-border p-3">
        <p class="text-sm">
          <span class="font-medium">Email:</span>
          {selectedUser.email as string}
        </p>
        <p class="text-sm mt-1">
          <span class="font-medium">Current Role:</span>
          {roleLabels[selectedUser.role as UserRole] || (selectedUser.role as string)}
        </p>
        <p class="text-sm mt-1">
          <span class="font-medium">Status:</span>
          <Badge variant={selectedUser.isActive ? 'success' : 'danger'}>
            {selectedUser.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </p>
      </div>

      <Select
        label="New Role"
        options={roleOptions}
        value={editRole}
        onchange={(val: string) => (editRole = val as UserRole)}
      />

      <div class="flex gap-3">
        <Button onclick={updateRole} loading={actionLoading}>
          <Shield class="h-4 w-4" />
          <span>Update Role</span>
        </Button>
        {#if selectedUser.isActive}
          <Button
            variant="destructive"
            onclick={() => {
              deactivateUser(selectedUser!._id as string);
              showEditModal = false;
            }}
          >
            <UserMinus class="h-4 w-4" />
            <span>Deactivate</span>
          </Button>
        {/if}
      </div>
    </div>
  {/if}
</Modal>
