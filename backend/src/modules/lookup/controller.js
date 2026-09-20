const db = require('../../db');

/**
 * Controller to provide dynamic dropdown options queried straight from the database.
 * No static or hardcoded options.
 */
const getLookupData = async (req, res, next) => {
  try {
    const { type } = req.params;

    switch (type) {
      case 'divisions': {
        const dbDivisions = await db('projects')
          .distinct('job_division as value')
          .whereNotNull('job_division')
          .where('job_division', '!=', '');
        
        const defaultDivs = ['PT Division', 'Civil Works', 'Post Tensioning', 'Floor Slabs', 'Infrastructure'];
        const values = Array.from(new Set([...defaultDivs, ...dbDivisions.map(d => d.value)]));
        return res.json({ success: true, data: values.map(v => ({ id: v, name: v, value: v })) });
      }

      case 'drawing-stages': {
        const dbStages = await db('project_drawings')
          .distinct('submission_stage as value')
          .whereNotNull('submission_stage');
        
        const defaultStages = [
          'Rev-00 Concept',
          'Rev-01 Submitted',
          'Rev-02 Client Review',
          'Rev-03 Approved',
          'Rev-04 IFC',
          'As-Built Approved'
        ];
        const values = Array.from(new Set([...defaultStages, ...dbStages.map(s => s.value)]));
        return res.json({ success: true, data: values.map(v => ({ id: v, name: v, value: v })) });
      }

      case 'project-statuses': {
        return res.json({
          success: true,
          data: [
            { id: 'active', name: 'Active / Running', value: 'active', color: 'emerald' },
            { id: 'planning', name: 'Planning / Kickoff', value: 'planning', color: 'blue' },
            { id: 'on_hold', name: 'On Hold', value: 'on_hold', color: 'amber' },
            { id: 'completed', name: 'Completed', value: 'completed', color: 'purple' },
            { id: 'cancelled', name: 'Cancelled', value: 'cancelled', color: 'rose' },
          ]
        });
      }

      case 'slab-statuses': {
        return res.json({
          success: true,
          data: {
            concreting: [
              { id: 'scheduled', name: 'Scheduled' },
              { id: 'in_progress', name: 'In Progress' },
              { id: 'done', name: 'Done' }
            ],
            stressing: [
              { id: 'pending', name: 'Pending' },
              { id: 'in_progress', name: 'In Progress (50%)' },
              { id: 'done', name: 'Stressed (100%)' }
            ],
            grouting: [
              { id: 'pending', name: 'Pending' },
              { id: 'in_progress', name: 'In Progress' },
              { id: 'done', name: 'Grouted' }
            ]
          }
        });
      }

      case 'supervisors': {
        // Fetch from employees or users
        const users = await db('users')
          .select('id', 'name', 'role', 'phone', 'email')
          .whereIn('role', ['site_supervisor', 'project_manager', 'super_admin', 'company_admin'])
          .orderBy('name', 'asc');
        
        return res.json({
          success: true,
          data: users.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            phone: u.phone,
            email: u.email
          }))
        });
      }

      case 'clients': {
        const clientList = await db('projects')
          .distinct('client as name')
          .whereNotNull('client')
          .where('client', '!=', '')
          .orderBy('client', 'asc');
        
        return res.json({
          success: true,
          data: clientList.map(c => ({ id: c.name, name: c.name, value: c.name }))
        });
      }

      case 'all': {
        // Aggregate full lookup bundle in a single call for initial frontend load
        const [divisions, clients, supervisors] = await Promise.all([
          db('projects').distinct('job_division as value').whereNotNull('job_division'),
          db('projects').distinct('client as name').whereNotNull('client'),
          db('users').select('id', 'name', 'role', 'phone').whereIn('role', ['site_supervisor', 'project_manager'])
        ]);

        return res.json({
          success: true,
          data: {
            divisions: Array.from(new Set(['PT Division', 'Civil Works', 'Floor Slabs', ...divisions.map(d => d.value)])),
            clients: clients.map(c => c.name),
            supervisors: supervisors,
            project_statuses: ['active', 'planning', 'on_hold', 'completed'],
            drawing_stages: ['Rev-00 Concept', 'Rev-01 Submitted', 'Rev-02 Approved', 'Rev-03 Approved', 'As-Built']
          }
        });
      }

      default:
        return res.status(404).json({ error: true, message: `Lookup type '${type}' not found.` });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLookupData
};
