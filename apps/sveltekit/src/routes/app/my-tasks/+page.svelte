<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Badge from '$ui/Badge.svelte';
  import Button from '$ui/Button.svelte';
  import Modal from '$ui/Modal.svelte';
  import Input from '$ui/Input.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import WidgetWrapper from '$lib/components/widgets/WidgetWrapper.svelte';
  import { KanbanSquare, Circle, AlertCircle, ExternalLink } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query';

  const userId = $derived($page.data.user?.id || '');
  const projectId = $derived($page.data.user?.projectId || '');

  const myTasksQuery = $derived(
    userId && projectId ? useConvexQuery('kanban:getMyTasks', { userId, projectId }) : null
  );

  const tasks = $derived(myTasksQuery?.data || []);
  const loading = $derived(myTasksQuery?.loading ?? true);

  let showCreateModal = $state(false);
  let newTask = $state({ title: '', description: '' });

  const priorityColors: Record<string, string> = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-400',
    high: 'border-l-orange-400',
    critical: 'border-l-red-400',
  };
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">My Tasks</h1>
      <p class="mt-1 text-sm text-muted-foreground">Tasks assigned to you, updated in real time</p>
    </div>
    <Button onclick={() => showCreateModal = true}>
      <span>New Task</span>
    </Button>
  </div>

  {#if loading}
    <div class="space-y-2">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-16 w-full" />
    </div>
  {:else if tasks.length === 0}
    <Card padding="lg">
      <div class="flex flex-col items-center justify-center py-8">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <KanbanSquare class="h-6 w-6" />
        </div>
        <p class="mt-3 text-sm font-medium">No tasks assigned to you yet</p>
        <p class="text-sm text-muted-foreground">Tasks will appear here when someone assigns them to you on a Kanban board.</p>
      </div>
    </Card>
  {:else}
    <div class="space-y-2">
      {#each tasks as task}
        <div class="rounded-md border border-border border-l-4 p-4" style="border-left-color: {priorityColors[task.priority] || '#9ca3af'}">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium">{task.title}</p>
              {#if task.description}
                <p class="mt-1 text-xs text-muted-foreground">{task.description}</p>
              {/if}
              <div class="mt-2 flex items-center gap-2">
                <Badge variant="outline">{task.status}</Badge>
                <Badge variant="outline">{task.priority}</Badge>
                {#if task.blockedReason}
                  <Badge variant="danger">Blocked</Badge>
                {/if}
              </div>
            </div>
            <ExternalLink class="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Kanban Board Widget -->
  <Card padding="lg">
    <div class="flex items-center gap-3 mb-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <KanbanSquare class="h-5 w-5" />
      </div>
      <div>
        <p class="font-medium">Kanban Board</p>
        <p class="text-sm text-muted-foreground">Drag-and-drop task management</p>
      </div>
    </div>
    <WidgetWrapper
      packageName="@sitesync/kanban-board"
      mountFnName="mountKanbanBoard"
      additionalProps={{
        boardId: projectId,
        filterMine: true,
      }}
    />
  </Card>
</div>

<Modal bind:open={showCreateModal} title="New Task">
  <div class="space-y-4">
    <Input label="Title" bind:value={newTask.title} placeholder="What needs to be done?" />
    <Input label="Description" bind:value={newTask.description} placeholder="Optional details..." />
    <Button onclick={async () => {
      const { mutation } = await import('$utils/convex-types');
      await mutation('kanban:createCard', {
        boardId: projectId,
        title: newTask.title,
        description: newTask.description,
        assigneeId: userId,
        priority: 'medium',
      });
      showCreateModal = false;
      newTask = { title: '', description: '' };
    }}>
      Create Task
    </Button>
  </div>
</Modal>
