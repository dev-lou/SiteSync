import { v } from 'convex/values';
import { mutation } from './_generated/server';

/**
 * Seed the database with sample data for development and testing.
 *
 * Usage: Call via the Convex dashboard or from a one-off script.
 *
 *   npx convex run seed:run
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // ── 1. Seed users ──────────────────────────────────────────────────
    const existingUsers = await ctx.db.query('users').collect();
    if (existingUsers.length > 0) {
      return { message: 'Database already has data — skipping seed.', count: existingUsers.length };
    }

    const adminId = await ctx.db.insert('users', {
      email: 'admin@sitesync.dev',
      name: 'Alex Rivera',
      role: 'admin',
      phone: '+1-555-0100',
      isActive: true,
    });

    const pmId = await ctx.db.insert('users', {
      email: 'pm@sitesync.dev',
      name: 'Jordan Chen',
      role: 'project_manager',
      phone: '+1-555-0101',
      isActive: true,
    });

    const architectId = await ctx.db.insert('users', {
      email: 'architect@sitesync.dev',
      name: 'Sam Patel',
      role: 'architect',
      phone: '+1-555-0102',
      isActive: true,
    });

    const fieldEngId = await ctx.db.insert('users', {
      email: 'field@sitesync.dev',
      name: 'Taylor Kim',
      role: 'field_engineer',
      phone: '+1-555-0103',
      isActive: true,
    });

    const hseId = await ctx.db.insert('users', {
      email: 'hse@sitesync.dev',
      name: 'Morgan Lee',
      role: 'hse_officer',
      phone: '+1-555-0104',
      isActive: true,
    });

    const procurementId = await ctx.db.insert('users', {
      email: 'procurement@sitesync.dev',
      name: 'Casey Davis',
      role: 'procurement',
      phone: '+1-555-0105',
      isActive: true,
    });

    const userIds = { adminId, pmId, architectId, fieldEngId, hseId, procurementId };
    const allUserIds = Object.values(userIds);

    // ── 2. Seed projects ───────────────────────────────────────────────
    const now = Date.now();
    const day = 86_400_000;

    const project1Id = await ctx.db.insert('projects', {
      name: 'Riverside Tower',
      code: 'RST-2026',
      description: '24-storey mixed-use residential and retail tower',
      address: '120 River Road, Portland, OR 97201',
      status: 'active',
      startDate: now - 60 * day,
      endDate: now + 300 * day,
      createdBy: adminId,
    });

    const project2Id = await ctx.db.insert('projects', {
      name: 'Greenfield Community Hospital',
      code: 'GCH-2026',
      description: '150-bed community hospital with emergency department',
      address: '45 Healthway Blvd, Salem, OR 97301',
      status: 'active',
      startDate: now - 30 * day,
      endDate: now + 540 * day,
      createdBy: pmId,
    });

    const project3Id = await ctx.db.insert('projects', {
      name: 'Oakwood Bridge Replacement',
      code: 'OBR-2025',
      description: 'Replacement of aging bridge structure on Highway 99',
      address: 'Highway 99 at Oakwood Crossing, Eugene, OR 97401',
      status: 'completed',
      startDate: now - 400 * day,
      endDate: now - 10 * day,
      createdBy: adminId,
    });

    // ── 3. Project members ─────────────────────────────────────────────
    const memberPairs = [
      [project1Id, adminId, 'owner'],
      [project1Id, pmId, 'project_manager'],
      [project1Id, architectId, 'architect'],
      [project1Id, fieldEngId, 'field_engineer'],
      [project1Id, hseId, 'hse_officer'],
      [project1Id, procurementId, 'procurement'],
      [project2Id, pmId, 'owner'],
      [project2Id, adminId, 'project_manager'],
      [project2Id, architectId, 'architect'],
      [project2Id, fieldEngId, 'field_engineer'],
      [project2Id, hseId, 'hse_officer'],
      [project3Id, adminId, 'owner'],
      [project3Id, pmId, 'project_manager'],
    ];

    for (const [projectId, userId, role] of memberPairs) {
      await ctx.db.insert('projectMembers' as any, {
        projectId,
        userId,
        role,
      });
    }

    // ── 4. Work zones (Riverside Tower) ────────────────────────────────
    const zone1Id = await ctx.db.insert('workZones', {
      projectId: project1Id,
      name: 'Foundation',
      svgPath: 'M 10,10 L 200,10 L 200,150 L 10,150 Z',
      status: 'completed',
    });

    const zone2Id = await ctx.db.insert('workZones', {
      projectId: project1Id,
      name: 'Ground Floor — Retail',
      svgPath: 'M 10,160 L 200,160 L 200,300 L 10,300 Z',
      status: 'active',
    });

    const zone3Id = await ctx.db.insert('workZones', {
      projectId: project1Id,
      name: 'Levels 2-8 — Residential',
      svgPath: 'M 210,10 L 400,10 L 400,300 L 210,300 Z',
      status: 'active',
    });

    const zone4Id = await ctx.db.insert('workZones', {
      projectId: project1Id,
      name: 'Levels 9-15',
      svgPath: 'M 10,310 L 400,310 L 400,450 L 10,450 Z',
      status: 'active',
    });

    const zone5Id = await ctx.db.insert('workZones', {
      projectId: project1Id,
      name: 'Roof / Mechanical Penthouse',
      svgPath: 'M 10,460 L 400,460 L 400,550 L 10,550 Z',
      status: 'suspended',
      suspendedReason: 'Awaiting steel delivery',
      suspendedBy: pmId,
      suspendedAt: now - 3 * day,
    });

    // Greenfield zones
    const gZone1Id = await ctx.db.insert('workZones', {
      projectId: project2Id,
      name: 'Site Prep & Excavation',
      svgPath: 'M 10,10 L 300,10 L 300,200 L 10,200 Z',
      status: 'active',
    });

    const gZone2Id = await ctx.db.insert('workZones', {
      projectId: project2Id,
      name: 'Foundation & Basement',
      svgPath: 'M 10,210 L 300,210 L 300,400 L 10,400 Z',
      status: 'active',
    });

    // ── 5. Deliveries ──────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const delivery1Id = await ctx.db.insert('deliveries', {
      projectId: project1Id,
      zoneId: zone3Id,
      title: 'Structural Steel — Levels 2-4',
      supplier: 'Pacific Steel Mills',
      materialList: [
        { name: 'Steel Beams W12x26', quantity: 48, unit: 'pcs' },
        { name: 'Steel Columns W10x33', quantity: 24, unit: 'pcs' },
        { name: 'High-Strength Bolts ASTM A325', quantity: 1200, unit: 'pcs' },
      ],
      status: 'in_transit',
      eta: todayTs + 2 * day,
      notes: 'Truck #4427 — ETA subject to traffic',
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
      updatedBy: procurementId,
    });

    const delivery2Id = await ctx.db.insert('deliveries', {
      projectId: project1Id,
      zoneId: zone2Id,
      title: 'HVAC Units — Ground Floor',
      supplier: 'Climate Control Corp',
      materialList: [
        { name: 'RTU-100 Rooftop Unit', quantity: 2, unit: 'pcs' },
        { name: 'Ductwork Kit DK-24', quantity: 1, unit: 'set' },
      ],
      status: 'received_inspected',
      eta: todayTs - 1 * day,
      actualArrival: todayTs - 1 * day,
      receivedBy: fieldEngId,
      notes: 'All items accounted for. Minor dent on RTU-100 #2 — photos taken.',
      createdAt: now - 10 * day,
      updatedAt: now - 1 * day,
      updatedBy: procurementId,
    });

    const delivery3Id = await ctx.db.insert('deliveries', {
      projectId: project1Id,
      zoneId: zone5Id,
      title: 'Roofing Materials',
      supplier: 'TopCover Industries',
      materialList: [
        { name: 'TPO Membrane 60mil', quantity: 30, unit: 'rolls' },
        { name: 'Insulation Board 4"', quantity: 120, unit: 'sheets' },
        { name: 'Adhesive PA-100', quantity: 10, unit: 'pails' },
      ],
      status: 'ordered',
      eta: todayTs + 14 * day,
      notes: 'Lead time 2 weeks from order',
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
      updatedBy: procurementId,
    });

    // ── 6. Inspections ─────────────────────────────────────────────────
    const inspection1Id = await ctx.db.insert('inspections', {
      projectId: project1Id,
      zoneId: zone2Id,
      title: 'Ground Floor Slab Inspection',
      checklist: [
        {
          item: 'Rebar placement per engineering drawings',
          required: true,
          passed: true,
          notes: 'Matches spec',
        },
        {
          item: 'Concrete cover (min 3")',
          required: true,
          passed: true,
          notes: '4.2" average — good',
        },
        { item: 'Control joints spacing', required: true, passed: true },
        { item: 'Curing compound applied', required: false, passed: true },
      ],
      status: 'passed',
      assigneeId: fieldEngId,
      createdBy: pmId,
      createdAt: now - 7 * day,
      completedAt: now - 6 * day,
      auditTrail: [
        { action: 'created', userId: pmId, timestamp: now - 7 * day },
        {
          action: 'assigned',
          userId: pmId,
          timestamp: now - 7 * day,
          detail: 'Assigned to Taylor Kim',
        },
        {
          action: 'completed',
          userId: fieldEngId,
          timestamp: now - 6 * day,
          detail: 'All items passed',
        },
      ],
    });

    const inspection2Id = await ctx.db.insert('inspections', {
      projectId: project1Id,
      zoneId: zone3Id,
      title: 'Steel Frame — Levels 2-4 Bolted Connections',
      checklist: [
        { item: 'Bolt grade matches spec (ASTM A325)', required: true, passed: true },
        {
          item: 'Torque verified per procedure',
          required: true,
          passed: false,
          notes: '3 connections under-torqued',
        },
        { item: 'Column plumb within tolerance', required: true, passed: true },
        { item: 'Beam-to-column connections complete', required: true, passed: true },
        { item: 'Fireproofing thickness verified', required: false },
      ],
      status: 'failed',
      assigneeId: fieldEngId,
      createdBy: pmId,
      createdAt: now - 3 * day,
      completedAt: now - 2 * day,
      auditTrail: [
        { action: 'created', userId: pmId, timestamp: now - 3 * day },
        { action: 'assigned', userId: pmId, timestamp: now - 3 * day },
        {
          action: 'completed',
          userId: fieldEngId,
          timestamp: now - 2 * day,
          detail: '3 bolts under-torqued — remedial needed',
        },
      ],
    });

    // ── 7. Blueprints ──────────────────────────────────────────────────
    const bp1Id = await ctx.db.insert('blueprints', {
      projectId: project1Id,
      title: 'Riverside Tower — Structural Foundation',
      description: 'Foundation plan including pile caps and grade beams',
      currentRevision: 3,
      status: 'approved',
      createdBy: architectId,
      createdAt: now - 90 * day,
    });

    const bp2Id = await ctx.db.insert('blueprints', {
      projectId: project1Id,
      title: 'Riverside Tower — Floor Plan Levels 2-8',
      description: 'Typical residential floor plan',
      currentRevision: 2,
      status: 'for_construction',
      createdBy: architectId,
      createdAt: now - 60 * day,
    });

    const bp3Id = await ctx.db.insert('blueprints', {
      projectId: project2Id,
      title: 'Greenfield Hospital — Ground Floor Layout',
      description: 'Emergency department and outpatient clinic layout',
      currentRevision: 1,
      status: 'in_review',
      createdBy: architectId,
      createdAt: now - 15 * day,
    });

    // ── 8. Kanban boards ───────────────────────────────────────────────
    const board1Id = await ctx.db.insert('kanbanBoards', {
      projectId: project1Id,
      title: 'Riverside Tower — Site Works',
      columns: [
        { id: 'backlog', title: 'Backlog', order: 0 },
        { id: 'ready', title: 'Ready', order: 1 },
        { id: 'in_progress', title: 'In Progress', order: 2 },
        { id: 'qc', title: 'QC Review', order: 3 },
        { id: 'done', title: 'Done', order: 4 },
        { id: 'blocked', title: 'Blocked', order: 5 },
      ],
      createdBy: pmId,
    });

    // ── 9. Kanban cards ────────────────────────────────────────────────
    await ctx.db.insert('kanbanCards', {
      boardId: board1Id,
      columnId: 'done',
      title: 'Excavation complete',
      description: 'Bulk excavation to 6m depth complete. Shoring installed.',
      assigneeId: fieldEngId,
      priority: 'high',
      status: 'done',
      order: 0,
      linkedInspectionId: inspection1Id,
      createdAt: now - 45 * day,
      updatedAt: now - 30 * day,
    });

    await ctx.db.insert('kanbanCards', {
      boardId: board1Id,
      columnId: 'in_progress',
      title: 'Install steel frame Levels 2-4',
      description:
        'Erect structural steel for lower residential floors. Coordinate with MEP rough-ins.',
      assigneeId: fieldEngId,
      priority: 'critical',
      status: 'in_progress',
      order: 0,
      linkedDeliveryId: delivery1Id,
      linkedInspectionId: inspection2Id,
      dueDate: todayTs + 10 * day,
      createdAt: now - 20 * day,
      updatedAt: now - 1 * day,
    });

    await ctx.db.insert('kanbanCards', {
      boardId: board1Id,
      columnId: 'blocked',
      title: 'Roof steel erection',
      description: 'Awaiting steel delivery for roof structure.',
      assigneeId: procurementId,
      priority: 'high',
      status: 'blocked',
      order: 0,
      linkedDeliveryId: delivery3Id,
      blockedReason: 'Steel delivery delayed — ETA +14 days',
      dueDate: todayTs + 21 * day,
      createdAt: now - 5 * day,
      updatedAt: now - 2 * day,
    });

    await ctx.db.insert('kanbanCards', {
      boardId: board1Id,
      columnId: 'backlog',
      title: 'MEP rough-in Levels 2-4',
      description: 'Run conduit, piping, and ductwork for residential floors.',
      assigneeId: fieldEngId,
      priority: 'medium',
      status: 'backlog',
      order: 0,
      dueDate: todayTs + 25 * day,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('kanbanCards', {
      boardId: board1Id,
      columnId: 'ready',
      title: 'Curtain wall mock-up',
      description: 'Install full-scale curtain wall mock-up for client approval.',
      assigneeId: architectId,
      priority: 'medium',
      status: 'ready',
      order: 0,
      dueDate: todayTs + 7 * day,
      createdAt: now - 3 * day,
      updatedAt: now - 1 * day,
    });

    // ── 10. Permits ────────────────────────────────────────────────────
    await ctx.db.insert('permits', {
      projectId: project1Id,
      zoneId: zone5Id,
      type: 'height_work',
      status: 'active',
      issuedTo: fieldEngId,
      issuedBy: hseId,
      appliedAt: now - 10 * day,
      activeAt: now - 8 * day,
      expiresAt: now + 5 * day,
      notes: 'Roof parapet work — full harness and lifeline required',
    });

    await ctx.db.insert('permits', {
      projectId: project1Id,
      zoneId: zone3Id,
      type: 'hot_work',
      status: 'active',
      issuedTo: fieldEngId,
      issuedBy: hseId,
      appliedAt: now - 3 * day,
      activeAt: now - 2 * day,
      expiresAt: now + 1 * day,
      notes: 'Welding on steel frame — fire watch assigned',
    });

    await ctx.db.insert('permits', {
      projectId: project1Id,
      zoneId: zone2Id,
      type: 'electrical',
      status: 'applied',
      issuedTo: fieldEngId,
      appliedAt: now - 1 * day,
      expiresAt: now + 30 * day,
    });

    // ── 11. Notifications ──────────────────────────────────────────────
    const notificationData = [
      {
        userId: pmId,
        type: 'delivery' as const,
        severity: 'success' as const,
        title: 'Delivery received',
        message: 'HVAC units delivered to Ground Floor — inspected and accepted.',
        link: '/app/deliveries',
        read: false,
        createdAt: now - 1 * day,
      },
      {
        userId: pmId,
        type: 'inspection' as const,
        severity: 'error' as const,
        title: 'Inspection failed',
        message: 'Steel frame bolted connections failed inspection — 3 bolts under-torqued.',
        link: '/app/inspections',
        read: false,
        createdAt: now - 2 * day,
      },
      {
        userId: adminId,
        type: 'permit' as const,
        severity: 'warning' as const,
        title: 'Permit expiring soon',
        message: 'Hot work permit for Levels 2-8 expires tomorrow.',
        link: '/app/safety',
        read: true,
        createdAt: now - 1 * day,
      },
      {
        userId: fieldEngId,
        type: 'task' as const,
        severity: 'info' as const,
        title: 'Task assigned',
        message: 'You have been assigned "Install steel frame Levels 2-4" — due in 10 days.',
        link: '/app/my-tasks',
        read: false,
        createdAt: now,
      },
      {
        userId: procurementId,
        type: 'delivery' as const,
        severity: 'warning' as const,
        title: 'Roof steel delayed',
        message: 'Pacific Steel Mills confirmed 14-day delay on roof steel order.',
        link: '/app/deliveries',
        read: false,
        createdAt: now,
      },
    ];

    for (const notif of notificationData) {
      await ctx.db.insert('notifications' as any, notif as any);
    }

    return {
      message: 'Seed data created successfully!',
      users: Object.keys(userIds).length,
      projects: 3,
      zones: 7,
      deliveries: 3,
      inspections: 2,
      blueprints: 3,
      boards: 1,
      cards: 5,
      permits: 3,
      notifications: 5,
    };
  },
});
