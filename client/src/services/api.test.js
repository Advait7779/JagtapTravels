import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('sends credentialed requests to the configured API and resolves uploaded documents', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.jagtaptravels.com/');
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ documents: [{ fileUrl: '/api/uploads/vehicle.pdf' }] }),
  });
  vi.stubGlobal('fetch', fetchMock);
  const { request } = await import('./api');
  const result = await request('/vehicles');
  expect(fetchMock).toHaveBeenCalledWith('https://api.jagtaptravels.com/api/vehicles',
    expect.objectContaining({ credentials: 'include' }));
  expect(result.documents[0].fileUrl).toBe('https://api.jagtaptravels.com/api/uploads/vehicle.pdf');
});

it('keeps same-origin API requests when no backend URL is configured', async () => {
  vi.stubEnv('VITE_API_BASE_URL', '');
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ready' }) });
  vi.stubGlobal('fetch', fetchMock);
  const { request } = await import('./api');
  await request('/health');
  expect(fetchMock).toHaveBeenCalledWith('/api/health',
    expect.objectContaining({ credentials: 'same-origin' }));
});
