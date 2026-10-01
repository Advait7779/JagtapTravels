const express = require('express');
const helmet = require('helmet');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');
const { authRoutes } = require('./auth');
const { auditMiddleware } = require('./audit');
const { createService, HttpError, text } = require('./domain');
const { identifier, invoiceMonth, validateCorporateInvoice } = require('./corporate-invoices');
function createApp(repo, options = {}) {
  const app = express(),
    service = createService(repo);
  const uploadsDir = path.resolve(
    options.uploadsDir || process.env.UPLOADS_DIR || path.resolve(__dirname, 'data', 'uploads'),
  );
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:'],
          'object-src': ["'self'", 'blob:', 'data:'],
          'frame-src': ["'self'", 'blob:', 'data:'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'script-src': ["'self'"],
          'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(express.json({ limit: '128kb' }));
  app.use('/api', (req, res, next) => {
    if (
      ['POST', 'PUT', 'PATCH'].includes(req.method) &&
      req.body !== undefined &&
      (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body))
    )
      return res.status(400).json({ error: 'Expected a JSON object.' });
    if (req.body === undefined) req.body = {};
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', auditMiddleware(repo));
  app.get('/api/health/live', (req, res) => res.json({ status: 'online' }));
  app.get('/api/health', async (req, res) => {
    try {
      await fs.promises.access(uploadsDir, fs.constants.W_OK);
      res.json({ status: 'ready', uploads: { writable: true }, ...(await repo.health()) });
    } catch {
      res.status(503).json({
        status: 'unavailable',
        error: 'Storage is unavailable. No fallback storage is used.',
      });
    }
  });
  authRoutes(app, repo, options);
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
  for (const [route, collection] of [
    ['customers', 'customers'],
    ['drivers', 'drivers'],
    ['bills', 'bills'],
    ['quotations', 'quotations'],
    ['meter-readings', 'meterReadings'],
    ['vehicles', 'vehicles'],
    ['bookings', 'bookings'],
    ['inquiries', 'inquiries'],
    ['corporate-contracts', 'corporateContracts'],
    ['fuel-logs', 'fuelLogs'],
    ['tyre-logs', 'tyreLogs'],
    ['driver-advances', 'driverAdvances'],
    ['corporate-trip-logs', 'corporateTripLogs'],
  ]) {
    app.get(
      '/api/' + route,
      wrap(async (req, res) => res.json(await service.list(collection))),
    );
    app.post(
      '/api/' + route,
      wrap(async (req, res) => res.status(201).json(await service.add(collection, req.body))),
    );
    app.delete(
      '/api/' + route + '/:id',
      wrap(async (req, res) => res.json(await service.remove(collection, req.params.id))),
    );
    if (
      [
        'customers',
        'drivers',
        'meterReadings',
        'vehicles',
        'bookings',
        'inquiries',
        'corporateContracts',
        'fuelLogs',
        'tyreLogs',
        'driverAdvances',
        'corporateTripLogs',
      ].includes(collection)
    )
      app.put(
        '/api/' + route + '/:id',
        wrap(async (req, res) =>
          res.json(await service.update(collection, req.params.id, req.body)),
        ),
      );
    if (['drivers', 'quotations', 'bookings', 'inquiries', 'corporateContracts'].includes(collection))
      app.patch(
        '/api/' + route + '/:id/status',
        wrap(async (req, res) =>
          res.json(await service.status(collection, req.params.id, req.body.status)),
        ),
      );
  }
  app.post(
    '/api/public/inquiries',
    wrap(async (req, res) => {
      const created = await service.add('inquiries', req.body);
      res.status(201).json({ success: true, inquiry: created });
    }),
  );
  app.post(
    '/api/vehicles/:id/daily-km',
    wrap(async (req, res) => res.json(await service.addDailyKm(req.params.id, req.body))),
  );
  app.post(
    '/api/vehicles/:id/service',
    wrap(async (req, res) => res.json(await service.recordService(req.params.id, req.body))),
  );
  app.post(
    '/api/bills/:id/payments',
    wrap(async (req, res) => res.json(await service.pay(req.params.id, req.body))),
  );
  app.get('/api/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    if (safeName !== req.params.filename || !/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(safeName))
      return res.status(404).json({ error: 'File not found.' });
    const filePath = path.join(uploadsDir, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(filePath);
  });

  const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 3 },
  });
  const fileKinds = [
    {
      mimeType: 'application/pdf',
      extension: 'pdf',
      matches: (buffer) => buffer.subarray(0, 5).toString() === '%PDF-',
    },
    {
      mimeType: 'image/jpeg',
      extension: 'jpg',
      matches: (buffer) =>
        buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    },
    {
      mimeType: 'image/png',
      extension: 'png',
      matches: (buffer) =>
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    },
    {
      mimeType: 'image/webp',
      extension: 'webp',
      matches: (buffer) =>
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString() === 'RIFF' &&
        buffer.subarray(8, 12).toString() === 'WEBP',
    },
  ];
  const removeStoredFile = async (document) => {
    if (!document?.fileUrl) return;
    const storedName = path.basename(document.fileUrl);
    if (!/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(storedName)) return;
    try {
      await fs.promises.unlink(path.join(uploadsDir, storedName));
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Failed to unlink document file:', error.message);
    }
  };

  app.post(
    '/api/meter-readings/:id/documents',
    documentUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file)
        throw Object.assign(new Error('Choose a document to upload.'), { status: 400 });
      const kind = fileKinds.find(
        (candidate) =>
          candidate.mimeType === req.file.mimetype && candidate.matches(req.file.buffer),
      );
      if (!kind)
        throw Object.assign(new Error('Only genuine PDF, JPEG, PNG and WebP files are allowed.'), {
          status: 400,
        });
      const safeOriginalName =
        path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._ -]/g, '_')
          .slice(0, 255) || `document.${kind.extension}`;
      const storedFileName = `${crypto.randomUUID()}.${kind.extension}`;
      const destPath = path.join(uploadsDir, storedFileName);
      try {
        await fs.promises.writeFile(destPath, req.file.buffer, { flag: 'wx', mode: 0o600 });
        const result = await service.addMeterDocument(req.params.id, {
          documentType: req.body.documentType || 'Vehicle Document',
          title: req.body.title || safeOriginalName,
          notes: req.body.notes || '',
          fileName: safeOriginalName,
          fileUrl: `/api/uploads/${storedFileName}`,
          fileSize: req.file.size,
          mimeType: kind.mimeType,
        });
        res.status(201).json(result);
      } catch (error) {
        await fs.promises.unlink(destPath).catch(() => {});
        throw error;
      }
    }),
  );

  app.get(
    '/api/meter-readings/:id/documents',
    wrap(async (req, res) => {
      const readings = await service.list('meterReadings');
      const slip = readings.find((r) => String(r.id) === String(req.params.id));
      if (!slip) return res.status(404).json({ error: 'Meter reading slip not found.' });
      res.json(slip.documents || []);
    }),
  );

  app.delete(
    '/api/meter-readings/:id/documents/:docId',
    wrap(async (req, res) => {
      const result = await service.removeMeterDocument(req.params.id, req.params.docId);
      await removeStoredFile(result.removedDocument);
      res.json(result);
    }),
  );

  // Corporate contract excess KM summary & auto-billing
  app.get(
    '/api/corporate-contracts/:id/monthly-summary',
    wrap(async (req, res) =>
      res.json(await service.calculateCorporateMonthlyKm(req.params.id, req.query.month)),
    ),
  );

  app.post(
    '/api/corporate-contracts/:id/generate-bill',
    wrap(async (req, res) => {
      res
        .status(201)
        .json(await service.generateCorporateBill(req.params.id, req.body?.month));
    }),
  );

  // Corporate Saved Invoice Drafts / Customizations
  app.get(
    '/api/corporate-contracts/:id/saved-invoice',
    wrap(async (req, res) => {
      const state = await repo.read();
      const month = invoiceMonth(req.query.month);
      const isNonGstQuery = req.query.isNonGst;
      if (!['true', 'false'].includes(isNonGstQuery))
        throw new HttpError(400, 'isNonGst must be true or false.');
      const list = state.corporateInvoices || [];
      const found = [...list]
        .sort(
          (a, b) =>
            Date.parse(b.updatedAt || b.createdAt || 0) -
            Date.parse(a.updatedAt || a.createdAt || 0),
        )
        .find((inv) => {
        if (String(inv.contractId) !== String(req.params.id)) return false;
        if (inv.month !== month) return false;
        const wantNonGst = isNonGstQuery === 'true';
        const invNonGst = Boolean(inv.isNonGst || inv.invoiceType === 'nongst');
        if (invNonGst !== wantNonGst) return false;
        return true;
      });
      res.json(found || null);
    }),
  );

  app.post(
    '/api/corporate-contracts/:id/saved-invoice',
    wrap(async (req, res) => {
      const requestedId = identifier(req.body.id);
      const validated = validateCorporateInvoice(req.body, req.params.id);
      let created = false;
      const result = await repo.change((d) => {
        d.corporateInvoices = Array.isArray(d.corporateInvoices) ? d.corporateInvoices : [];
        if (!d.corporateContracts.some((contract) => String(contract.id) === validated.contractId))
          throw new HttpError(404, 'Corporate contract not found.');
        const idx = requestedId
          ? d.corporateInvoices.findIndex((invoice) => String(invoice.id) === requestedId)
          : -1;
        if (requestedId && idx < 0)
          throw new HttpError(404, 'Corporate invoice no longer exists. Refresh the list before saving.');
        if (idx >= 0 && String(d.corporateInvoices[idx].contractId) !== validated.contractId)
          throw new HttpError(409, 'Invoice does not belong to this corporate contract.');
        const duplicateNumber = d.corporateInvoices.findIndex(
          (invoice, invoiceIndex) =>
            invoiceIndex !== idx &&
            String(invoice.invoiceNo || '').toLowerCase() === validated.invoiceNo.toLowerCase(),
        );
        if (duplicateNumber >= 0)
          throw new HttpError(409, 'Corporate invoice number already exists.');
        const duplicatePeriod = d.corporateInvoices.findIndex((invoice, invoiceIndex) => {
          if (invoiceIndex === idx) return false;
          const invoiceNonGst = Boolean(invoice.isNonGst || invoice.invoiceType === 'nongst');
          return (
            String(invoice.contractId) === validated.contractId &&
            invoice.month === validated.month &&
            invoiceNonGst === validated.isNonGst
          );
        });
        if (duplicatePeriod >= 0)
          throw new HttpError(
            409,
            'An invoice of this type already exists for this contract and month. Open it from Corporate Invoices to edit it.',
          );
        const existing = idx >= 0 ? d.corporateInvoices[idx] : null;
        const now = new Date().toISOString();
        const record = {
          ...validated,
          id: existing?.id || crypto.randomUUID(),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
        if (idx >= 0) {
          d.corporateInvoices[idx] = record;
        } else {
          d.corporateInvoices.unshift(record);
          created = true;
        }
        return record;
      });
      res.status(created ? 201 : 200).json(result);
    }),
  );

  // Corporate Invoices list & delete endpoints
  app.get(
    '/api/corporate-invoices',
    wrap(async (req, res) => {
      const state = await repo.read();
      const list = Array.isArray(state.corporateInvoices) ? [...state.corporateInvoices] : [];
      list.sort(
        (a, b) =>
          Date.parse(b.updatedAt || b.createdAt || 0) -
          Date.parse(a.updatedAt || a.createdAt || 0),
      );
      res.json(list);
    }),
  );

  app.delete(
    '/api/corporate-invoices/:id',
    wrap(async (req, res) => {
      const targetId = String(req.params.id);
      const result = await repo.change((d) => {
        d.corporateInvoices = Array.isArray(d.corporateInvoices) ? d.corporateInvoices : [];
        const initialLen = d.corporateInvoices.length;
        d.corporateInvoices = d.corporateInvoices.filter((inv) => String(inv.id) !== targetId);
        if (d.corporateInvoices.length === initialLen)
          throw new HttpError(404, 'Corporate invoice not found.');
        return { success: true };
      });
      res.json(result);
    }),
  );

  // Driver Payroll & Advance summary
  app.get(
    '/api/payroll',
    wrap(async (req, res) => res.json(await service.getDriverPayroll(req.query.month))),
  );

  // Driver License / Document upload
  app.post(
    '/api/drivers/:id/documents',
    documentUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file)
        throw Object.assign(new Error('Choose a document to upload.'), { status: 400 });
      const kind = fileKinds.find(
        (candidate) =>
          candidate.mimeType === req.file.mimetype && candidate.matches(req.file.buffer),
      );
      if (!kind)
        throw Object.assign(new Error('Only genuine PDF, JPEG, PNG and WebP files are allowed.'), {
          status: 400,
        });
      const safeOriginalName =
        path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._ -]/g, '_')
          .slice(0, 255) || `document.${kind.extension}`;
      const storedFileName = `${crypto.randomUUID()}.${kind.extension}`;
      const destPath = path.join(uploadsDir, storedFileName);
      try {
        await fs.promises.writeFile(destPath, req.file.buffer, { flag: 'wx', mode: 0o600 });
        const result = await service.addDriverDocument(req.params.id, {
          documentType: req.body.documentType || "Driver's License",
          title: req.body.title || safeOriginalName,
          notes: req.body.notes || '',
          fileName: safeOriginalName,
          fileUrl: `/api/uploads/${storedFileName}`,
          fileSize: req.file.size,
          mimeType: kind.mimeType,
        });
        res.status(201).json(result);
      } catch (error) {
        await fs.promises.unlink(destPath).catch(() => {});
        throw error;
      }
    }),
  );

  app.delete(
    '/api/drivers/:id/documents/:docId',
    wrap(async (req, res) => {
      const result = await service.removeDriverDocument(req.params.id, req.params.docId);
      await removeStoredFile(result.removedDocument);
      res.json(result);
    }),
  );

  // Vehicle RC / Document upload
  app.post(
    '/api/vehicles/:id/documents',
    documentUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file)
        throw Object.assign(new Error('Choose a document to upload.'), { status: 400 });
      const kind = fileKinds.find(
        (candidate) =>
          candidate.mimeType === req.file.mimetype && candidate.matches(req.file.buffer),
      );
      if (!kind)
        throw Object.assign(new Error('Only genuine PDF, JPEG, PNG and WebP files are allowed.'), {
          status: 400,
        });
      const safeOriginalName =
        path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._ -]/g, '_')
          .slice(0, 255) || `document.${kind.extension}`;
      const storedFileName = `${crypto.randomUUID()}.${kind.extension}`;
      const destPath = path.join(uploadsDir, storedFileName);
      try {
        await fs.promises.writeFile(destPath, req.file.buffer, { flag: 'wx', mode: 0o600 });
        const result = await service.addVehicleDocument(req.params.id, {
          documentType: req.body.documentType || 'Vehicle RC',
          title: req.body.title || safeOriginalName,
          notes: req.body.notes || '',
          fileName: safeOriginalName,
          fileUrl: `/api/uploads/${storedFileName}`,
          fileSize: req.file.size,
          mimeType: kind.mimeType,
        });
        res.status(201).json(result);
      } catch (error) {
        await fs.promises.unlink(destPath).catch(() => {});
        throw error;
      }
    }),
  );

  app.delete(
    '/api/vehicles/:id/documents/:docId',
    wrap(async (req, res) => {
      const result = await service.removeVehicleDocument(req.params.id, req.params.docId);
      if (!result.removedDocument?.slipNumber) await removeStoredFile(result.removedDocument);
      res.json(result);
    }),
  );

  app.get(
    '/api/settings',
    wrap(async (req, res) => res.json((await repo.read()).settings)),
  );
  app.post(
    '/api/settings/asset',
    documentUpload.single('file'),
    wrap(async (req, res) => {
      if (!req.file)
        throw Object.assign(new Error('Choose an image file to upload.'), { status: 400 });
      const kind = fileKinds.find(
        (candidate) =>
          candidate.mimeType === req.file.mimetype && candidate.matches(req.file.buffer),
      );
      if (!kind || !['jpg', 'png', 'webp'].includes(kind.extension))
        throw Object.assign(new Error('Only JPG, PNG and WebP images are allowed.'), {
          status: 400,
        });
      const storedFileName = `${crypto.randomUUID()}.${kind.extension}`;
      const destPath = path.join(uploadsDir, storedFileName);
      try {
        await fs.promises.writeFile(destPath, req.file.buffer, { flag: 'wx', mode: 0o600 });
        res.status(201).json({ fileUrl: `/api/uploads/${storedFileName}` });
      } catch (error) {
        await fs.promises.unlink(destPath).catch(() => {});
        throw error;
      }
    }),
  );

  app.put(
    '/api/settings',
    wrap(async (req, res) => {
      const names = [
        'companyName',
        'address',
        'phone',
        'phone2',
        'email',
        'gstNumber',
        'bankName',
        'bankBranch',
        'accountName',
        'accountNumber',
        'ifsc',
        'upi',
        'stampUrl',
        'signatureUrl',
        'ratePerKmSedan',
        'ratePerKmErtiga',
        'ratePerKmCrysta',
        'ratePerKmTempo',
        'ratePerKmBus',
        'driverAllowanceDay',
        'driverAllowanceNight',
        'defaultDueDays',
      ];
      const settings = Object.fromEntries(
        names.map((k) => [k, text(req.body[k], k, k === 'companyName', 500)]),
      );
      res.json(
        await repo.change((d) => {
          d.settings = settings;
          return settings;
        }),
      );
    }),
  );
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  const clientDir = options.clientDir || path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(path.join(clientDir, 'index.html'))) {
    app.use(express.static(clientDir, { index: false }));
    app.get(/.*/, (req, res) => res.sendFile(path.join(clientDir, 'index.html')));
  }
  app.use((err, req, res, next) => {
    const status =
      err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 413
        : err instanceof multer.MulterError
        ? 400
        : err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error:
        status >= 500
          ? 'Unable to complete the request. Check server/storage availability.'
          : status === 413
          ? 'Document exceeds the 10 MB upload limit.'
          : err.message,
    });
  });
  return app;
}
module.exports = { createApp };
