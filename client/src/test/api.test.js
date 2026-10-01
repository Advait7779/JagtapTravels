import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../services/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('accepts a null response when no corporate invoice has been saved', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => null,
  }));

  await expect(api.getSavedCorporateInvoice('contract-1', '2026-10', true)).resolves.toBeNull();
});

it('reports a failed request even when its response body is null', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => null,
  }));

  await expect(api.getSavedCorporateInvoice('contract-1', '2026-10', true))
    .rejects.toThrow('Request failed.');
});
