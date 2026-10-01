const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const request = require('supertest');
const { Repository } = require('../data/repository');
const { createApp } = require('../app');

test('admin document upload validates content, isolates files, serves and deletes', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jagtap-test-docs-'));
  const resolved = path.resolve(dir);
  t.after(async () => {
    assert.ok(
      resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith('jagtap-test-docs-'),
    );
    await fs.rm(resolved, { recursive: true, force: true });
  });

  const uploadsDir = path.join(dir, 'uploads');
  const repo = new Repository({ mode: 'json', file: path.join(dir, 'db.json') });
  await repo.initialize();
  await repo.change((data) => {
    data.drivers.push({
      id: 'driver-1',
      name: 'Santosh Patil',
      phone: '9823000000',
      licenseNumber: 'MH12-2020-000001',
      documents: [],
    });
    data.vehicles.push({
      id: 'veh-1',
      name: 'Toyota Innova Crysta',
      vehicleNumber: 'MH 12 QX 4589',
      currentOdometer: 42000,
      lastServiceKm: 30000,
      documents: [],
    });
    data.meterReadings.push({
      id: 'slip-1',
      slipNumber: 'DS-2026-001',
      vehicleName: 'Toyota Innova Crysta',
      vehicleNumber: 'MH12QX4589',
      driverName: 'Santosh Patil',
      tripSource: 'Pune',
      tripDestination: 'Mahabaleshwar',
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      openingKm: 42000,
      closingKm: 42500,
      totalKm: 500,
      status: 'Completed',
      documents: [],
    });
  });

  const app = createApp(repo, {
    secure: false,
    setupToken: 'test-document-setup-token',
    uploadsDir,
  });
  const agent = request.agent(app);
  const setup = await agent
    .post('/api/auth/setup')
    .send({
      setupToken: 'test-document-setup-token',
      email: 'admin@example.invalid',
      password: 'Strong-Document-Secret-2026',
      fullName: 'Document Admin',
    })
    .expect(201);
  const csrf = setup.body.csrfToken;
  const pdf = Buffer.from('%PDF-1.4\n% test document\n%%EOF');

  await request(app).get('/api/meter-readings/slip-1/documents').expect(401);
  await request(app).get('/api/uploads/not-a-real-file.pdf').expect(401);

  await request(app)
    .post('/api/meter-readings/slip-1/documents')
    .attach('file', pdf, { filename: 'anonymous.pdf', contentType: 'application/pdf' })
    .expect(401);

  const upload = await agent
    .post('/api/meter-readings/slip-1/documents')
    .set('X-CSRF-Token', csrf)
    .field('documentType', 'Vehicle RC')
    .field('title', 'Innova Registration Certificate')
    .field('notes', 'Valid until 2030')
    .attach('file', pdf, { filename: 'innova_rc.pdf', contentType: 'application/pdf' })
    .expect(201);

  const document = upload.body.document;
  assert.equal(document.documentType, 'Vehicle RC');
  assert.equal(document.fileName, 'innova_rc.pdf');
  assert.match(document.fileUrl, /^\/api\/uploads\/[a-f0-9-]+\.pdf$/);
  assert.equal((await fs.readdir(uploadsDir)).length, 1);

  await agent
    .post('/api/meter-readings/slip-1/documents')
    .set('X-CSRF-Token', csrf)
    .attach('file', Buffer.from('not a real pdf'), {
      filename: 'fake.pdf',
      contentType: 'application/pdf',
    })
    .expect(400);
  assert.equal((await fs.readdir(uploadsDir)).length, 1);

  await agent
    .post('/api/meter-readings/missing/documents')
    .set('X-CSRF-Token', csrf)
    .attach('file', pdf, { filename: 'orphan.pdf', contentType: 'application/pdf' })
    .expect(404);
  assert.equal((await fs.readdir(uploadsDir)).length, 1);

  const list = await agent.get('/api/meter-readings/slip-1/documents').expect(200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].id, document.id);

  const state = await repo.read();
  assert.equal(state.vehicles[0].documents[0].id, document.id);

  const storedName = path.basename(document.fileUrl);
  const served = await agent.get('/api/uploads/' + storedName).expect(200);
  assert.equal(served.headers['content-type'], 'application/pdf');
  assert.match(served.headers['content-disposition'], /inline/);

  await agent.delete(`/api/meter-readings/slip-1/documents/${document.id}`).expect(403);
  await agent
    .delete(`/api/meter-readings/slip-1/documents/${document.id}`)
    .set('X-CSRF-Token', csrf)
    .expect(200);
  assert.equal((await fs.readdir(uploadsDir)).length, 0);
  const after = await repo.read();
  assert.equal(after.meterReadings[0].documents.length, 0);
  assert.equal(after.vehicles[0].documents.length, 0);

  const driverUpload = await agent
    .post('/api/drivers/driver-1/documents')
    .set('X-CSRF-Token', csrf)
    .field('documentType', "Driver's License")
    .attach('file', pdf, { filename: 'driver_license.pdf', contentType: 'application/pdf' })
    .expect(201);
  const vehicleUpload = await agent
    .post('/api/vehicles/veh-1/documents')
    .set('X-CSRF-Token', csrf)
    .field('documentType', 'Vehicle RC')
    .attach('file', pdf, { filename: 'vehicle_rc.pdf', contentType: 'application/pdf' })
    .expect(201);
  assert.equal((await fs.readdir(uploadsDir)).length, 2);

  await agent
    .delete(`/api/drivers/driver-1/documents/${driverUpload.body.document.id}`)
    .set('X-CSRF-Token', csrf)
    .expect(200);
  await agent
    .delete(`/api/vehicles/veh-1/documents/${vehicleUpload.body.document.id}`)
    .set('X-CSRF-Token', csrf)
    .expect(200);
  assert.equal((await fs.readdir(uploadsDir)).length, 0);
  const afterDirectDeletes = await repo.read();
  assert.equal(afterDirectDeletes.drivers[0].documents.length, 0);
  assert.equal(afterDirectDeletes.vehicles[0].documents.length, 0);
});
