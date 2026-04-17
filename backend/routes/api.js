const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// Basic CRUD: Machines
router.get('/machines', async (_req, res) => {
  try {
    const machines = await prisma.machine.findMany({ orderBy: { id: 'asc' } });
    res.json(machines);
  } catch (err) {
    console.error('GET /machines error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/machines/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid machine id' });

    const machine = await prisma.machine.findUnique({ where: { id } });
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    res.json(machine);
  } catch (err) {
    console.error('GET /machines/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/machines', async (req, res) => {
  try {
    const { machine_code, location, area, status } = req.body;
    if (!machine_code || !location) {
      return res.status(400).json({ error: 'machine_code and location required' });
    }

    const machine = await prisma.machine.create({
      data: {
        machineCode: machine_code,
        location,
        area: area || null,
        status: status || 'active',
      },
    });
    res.status(201).json(machine);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Machine code already exists' });
    console.error('POST /machines error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/machines/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid machine id' });

    const { machine_code, location, area, status } = req.body;
    const machine = await prisma.machine.update({
      where: { id },
      data: {
        ...(machine_code !== undefined ? { machineCode: machine_code } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(area !== undefined ? { area } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    res.json(machine);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Machine not found' });
    if (err.code === 'P2002') return res.status(400).json({ error: 'Machine code already exists' });
    console.error('PUT /machines/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/machines/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid machine id' });

    await prisma.machine.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Machine not found' });
    console.error('DELETE /machines/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Basic CRUD: Submissions
router.get('/submissions', async (_req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: { machine: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error('GET /submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/submissions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid submission id' });

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { machine: true },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    console.error('GET /submissions/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/machine/:id — fetch machine info + active forms
router.get('/machine/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid machine id' });
    }

    const machine = await prisma.machine.findUnique({
      where: { id },
    });
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    const forms = await prisma.formConfig.findMany({
      where: { isEnabled: true },
      orderBy: { displayOrder: 'asc' },
    });

    return res.json({ machine, forms });
  } catch (err) {
    console.error('GET /machine/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/submit — submit a form using machine_id + form_type
router.post('/submit', async (req, res) => {
  try {
    const { machine_id, form_type, data } = req.body;
    const machineId = Number(machine_id);

    if (!machine_id || Number.isNaN(machineId) || !form_type || !data || typeof data !== 'object') {
      return res.status(400).json({ error: 'machine_id, form_type, and data are required' });
    }

    const machine = await prisma.machine.findUnique({ where: { id: machineId } });
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    const formConfig = await prisma.formConfig.findFirst({
      where: { type: form_type, isEnabled: true },
    });
    if (!formConfig) {
      return res.status(400).json({ error: 'Invalid form_type' });
    }

    const fields = Array.isArray(formConfig.fields) ? formConfig.fields : [];
    const missingRequired = fields
      .filter((field) => field && field.required)
      .map((field) => field.name)
      .filter((name) => {
        const value = data[name];
        return value === undefined || value === null || value === '';
      });

    if (missingRequired.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields: missingRequired,
      });
    }

    const submission = await prisma.submission.create({
      data: {
        machineId,
        type: form_type,
        data,
        status: 'pending',
        whatsappStatus: 'not_contacted',
        createdAt: new Date(),
      },
      select: { id: true },
    });

    return res.status(201).json({
      success: true,
      submissionId: submission.id,
    });
  } catch (err) {
    console.error('POST /submit error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/submissions — submit a form
router.post('/submissions', async (req, res) => {
  try {
    const { machine_id, type, data } = req.body;
    const parsedMachineId = Number(machine_id);

    if (!machine_id || Number.isNaN(parsedMachineId) || !type || !data) {
      return res.status(400).json({ error: 'machine_id, type, and data are required' });
    }

    const validTypes = ['complaint', 'refund', 'feedback', 'suggestion', 'rating'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid submission type' });
    }

    // Sanitize data keys
    const sanitized = {};
    for (const [k, v] of Object.entries(data)) {
      const key = k.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
      const val = typeof v === 'string' ? v.slice(0, 2000) : v;
      sanitized[key] = val;
    }

    const submission = await prisma.submission.create({
      data: {
        machineId: parsedMachineId,
        type,
        data: sanitized,
        status: 'pending',
        whatsappStatus: 'not_contacted',
      },
    });

    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error('POST /submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/submissions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid submission id' });

    const { machine_id, type, data, status, whatsapp_status, notes } = req.body;
    const parsedMachineId =
      machine_id !== undefined ? Number(machine_id) : undefined;
    if (machine_id !== undefined && Number.isNaN(parsedMachineId)) {
      return res.status(400).json({ error: 'Invalid machine_id' });
    }
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...(parsedMachineId !== undefined ? { machineId: parsedMachineId } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(data !== undefined ? { data } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(whatsapp_status !== undefined ? { whatsappStatus: whatsapp_status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        updatedAt: new Date(),
      },
    });

    res.json(submission);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Submission not found' });
    console.error('PUT /submissions/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/submissions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid submission id' });

    await prisma.submission.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Submission not found' });
    console.error('DELETE /submissions/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hardcodedEmail = 'admin@snackmaster.com';
    const hardcodedPassword = 'admin123';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (email === hardcodedEmail && password === hardcodedPassword) {
      const admin = { id: 0, email: hardcodedEmail, name: 'Admin' };
      const token = jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, admin });
    }

    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    console.error('POST /admin/login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// ADMIN PROTECTED ROUTES
// ─────────────────────────────────────────────

// GET /api/admin/submissions
router.get('/admin/submissions', authMiddleware, async (req, res) => {
  try {
    const { machine_id, type, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (machine_id) {
      conditions.push(`s.machine_id = $${idx++}`);
      params.push(machine_id);
    }
    if (type) {
      conditions.push(`s.type = $${idx++}`);
      params.push(type);
    }
    if (status) {
      conditions.push(`s.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT s.*, m.machine_code, m.location, m.area
      FROM submissions s
      LEFT JOIN machines m ON s.machine_id = m.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM submissions s
      LEFT JOIN machines m ON s.machine_id = m.id
      ${where}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      submissions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GET /admin/submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/submissions/:id — update status or whatsapp_status
router.patch('/admin/submissions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, whatsapp_status, notes } = req.body;

    const updates = [];
    const params = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      params.push(status);
    }
    if (whatsapp_status) {
      updates.push(`whatsapp_status = $${idx++}`);
      params.push(whatsapp_status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE submissions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ success: true, submission: result.rows[0] });
  } catch (err) {
    console.error('PATCH /admin/submissions/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/machines
router.get('/admin/machines', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM machines ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/machines — add machine
router.post('/admin/machines', authMiddleware, async (req, res) => {
  try {
    const { machine_code, location, area, status } = req.body;
    if (!machine_code || !location) {
      return res.status(400).json({ error: 'machine_code and location required' });
    }
    const result = await pool.query(
      'INSERT INTO machines (machine_code, location, area, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [machine_code, location, area || '', status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Machine code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/machines/:id
router.patch('/admin/machines/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { location, area, status } = req.body;
    const result = await pool.query(
      'UPDATE machines SET location = COALESCE($1, location), area = COALESCE($2, area), status = COALESCE($3, status) WHERE id = $4 RETURNING *',
      [location, area, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Machine not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/form-configs
router.get('/admin/form-configs', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM form_configs ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/form-configs/:id
router.patch('/admin/form-configs/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_enabled, label, fields, display_order } = req.body;

    const updates = [];
    const params = [];
    let idx = 1;

    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${idx++}`);
      params.push(is_enabled);
    }
    if (label) {
      updates.push(`label = $${idx++}`);
      params.push(label);
    }
    if (fields) {
      updates.push(`fields = $${idx++}`);
      params.push(JSON.stringify(fields));
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${idx++}`);
      params.push(display_order);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE form_configs SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/weekly-config
router.get('/admin/weekly-config', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weekly_config ORDER BY created_at DESC LIMIT 1');
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/weekly-config — upsert weekly config
router.put('/admin/weekly-config', authMiddleware, async (req, res) => {
  try {
    const { title, start_date, end_date, is_active } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Deactivate all, then insert new
    await pool.query('UPDATE weekly_config SET is_active = false');
    const result = await pool.query(
      'INSERT INTO weekly_config (title, start_date, end_date, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, start_date, end_date, is_active !== false]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/analytics — stats
router.get('/admin/analytics', authMiddleware, async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT
        COUNT(*)::int AS total_submissions,
        COUNT(*) FILTER (WHERE type = 'complaint')::int AS total_complaints,
        COUNT(*) FILTER (WHERE type = 'refund')::int AS total_refunds,
        COUNT(*) FILTER (WHERE type = 'feedback')::int AS total_feedback
      FROM submissions
    `);

    // Total by type
    const byType = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM submissions
      GROUP BY type
      ORDER BY count DESC
    `);

    // Complaints by machine
    const byMachine = await pool.query(`
      SELECT m.machine_code, m.location, s.type, COUNT(*) as count
      FROM submissions s
      JOIN machines m ON s.machine_id = m.id
      GROUP BY m.machine_code, m.location, s.type
      ORDER BY count DESC
      LIMIT 20
    `);

    const complaintsPerMachine = await pool.query(`
      SELECT
        s.machine_id,
        m.machine_code,
        COUNT(*)::int AS complaints
      FROM submissions s
      LEFT JOIN machines m ON s.machine_id = m.id
      WHERE s.type = 'complaint'
      GROUP BY s.machine_id, m.machine_code
      ORDER BY complaints DESC
    `);

    // Pending counts
    const pending = await pool.query(`
      SELECT type, status, COUNT(*) as count
      FROM submissions
      WHERE status = 'pending'
      GROUP BY type, status
    `);

    // Refund total amount
    const refundTotal = await pool.query(`
      SELECT COALESCE(SUM((data->>'amount')::numeric), 0) as total_amount,
             COUNT(*) as total_refunds
      FROM submissions
      WHERE type = 'refund'
    `);

    // Last 7 days trend
    const trend = await pool.query(`
      SELECT DATE(created_at) as date, type, COUNT(*) as count
      FROM submissions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), type
      ORDER BY date ASC
    `);

    res.json({
      totalSubmissions: totals.rows[0].total_submissions,
      totalComplaints: totals.rows[0].total_complaints,
      totalRefunds: totals.rows[0].total_refunds,
      totalFeedback: totals.rows[0].total_feedback,
      refundsCount: totals.rows[0].total_refunds,
      complaintsPerMachine: complaintsPerMachine.rows,
      byType: byType.rows,
      byMachine: byMachine.rows,
      pending: pending.rows,
      refunds: refundTotal.rows[0],
      trend: trend.rows,
    });
  } catch (err) {
    console.error('GET /admin/analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
