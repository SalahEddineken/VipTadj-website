// @vitest-environment node
import { describe, it, expect, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/media/upload/route';
import fs from 'fs/promises';
import path from 'path';

describe('Admin Media Upload API (/api/media/upload)', () => {
  const createdTestFiles: string[] = [];

  afterAll(async () => {
    // Clean up test files created in public/uploads
    for (const filePath of createdTestFiles) {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore
      }
    }
  });

  it('handles single file upload from PC/phone and saves to public/uploads directory', async () => {
    const dummyImageContent = 'fake-jpeg-binary-content-vip-tadj';
    const file = new File([dummyImageContent], 'suit-navy-sample.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', 'Costume Bleu Nuit');
    formData.append('isPrimary', 'true');

    const req = new NextRequest(
      new Request('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.image).toBeDefined();
    expect(data.image.url).toMatch(/^\/uploads\/suit-navy-sample-img-/);
    expect(data.image.alt).toBe('Costume Bleu Nuit');
    expect(data.image.isPrimary).toBe(true);

    // Verify file exists on local filesystem
    const diskPath = path.join(process.cwd(), 'public', data.image.url);
    createdTestFiles.push(diskPath);
    const stat = await fs.stat(diskPath);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('handles multiple files uploaded simultaneously from PC or phone gallery', async () => {
    const file1 = new File(['sample-img-1'], 'angle-front.png', { type: 'image/png' });
    const file2 = new File(['sample-img-2'], 'angle-back.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', file1);
    formData.append('file', file2);
    formData.append('alt', 'Costume Deux Angles');
    formData.append('isPrimary', 'true');

    const req = new NextRequest(
      new Request('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(data.images).toHaveLength(2);
    expect(data.images[0].isPrimary).toBe(true);
    expect(data.images[1].isPrimary).toBe(false);

    data.images.forEach((img: any) => {
      const diskPath = path.join(process.cwd(), 'public', img.url);
      createdTestFiles.push(diskPath);
    });
  });

  it('accepts direct JSON image URL input for Google Drive or CDN links', async () => {
    const req = new NextRequest('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
        alt: 'Smoking Noir',
        isPrimary: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.image.url).toContain('https://images.unsplash.com');
    expect(data.image.alt).toBe('Smoking Noir');
  });

  it('rejects empty payloads with 400 Bad Request', async () => {
    const formData = new FormData();
    const req = new NextRequest(
      new Request('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
