import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as statusPatch } from '@/app/api/orders/[id]/status/route';
import { GET as orderGet } from '@/app/api/orders/[id]/route';
import { getDataStore } from '@/lib/data-provider';

describe('Order Status API Route (PATCH /api/orders/[id]/status & GET /api/orders/[id])', () => {
  beforeEach(async () => {
    const store = getDataStore();
    await store.seedCatalog(true);
  });

  it('GET /api/orders/[id] returns order dossier for valid ID', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/ord-001');
    const res = await orderGet(req, { params: { id: 'ord-001' } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.id).toBe('ord-001');
    expect(data.order.orderNumber).toBe('VIP-2026-0001');
  });

  it('GET /api/orders/[id] returns 404 for non-existent order', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/non-existent');
    const res = await orderGet(req, { params: { id: 'non-existent' } });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('PATCH /api/orders/[id]/status advances pending order to confirmed', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'confirmed',
        note: 'Client validé au téléphone',
        updatedBy: 'Admin Mehdi',
      }),
    });

    const res = await statusPatch(req, { params: { id: 'ord-001' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe('confirmed');
    const lastHistory = data.order.statusHistory[data.order.statusHistory.length - 1];
    expect(lastHistory.status).toBe('confirmed');
    expect(lastHistory.note).toBe('Client validé au téléphone');
  });

  it('PATCH /api/orders/[id]/status rejects invalid state skip (pending -> delivered) with 422', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'delivered',
      }),
    });

    const res = await statusPatch(req, { params: { id: 'ord-001' } });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('INVALID_STATE_TRANSITION');
    expect(data.allowedTransitions).toEqual(['confirmed', 'cancelled']);
  });

  it('PATCH /api/orders/[id]/status rejects cancellation without explanatory note or reason with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'cancelled',
        note: '',
      }),
    });

    const res = await statusPatch(req, { params: { id: 'ord-001' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('obligatoire');
  });

  it('PATCH /api/orders/[id]/status allows cancellation with valid cancellation reason and restores stock', async () => {
    const store = getDataStore();
    const suit = await store.getProductById('prod-suit-01');
    const initialStock = suit!.stockQuantity;

    const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'cancelled',
        cancellationReason: 'customer_unreachable',
      }),
    });

    const res = await statusPatch(req, { params: { id: 'ord-001' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.status).toBe('cancelled');

    // Verify stock restored
    const suitAfter = await store.getProductById('prod-suit-01');
    expect(suitAfter?.stockQuantity).toBe(initialStock + 1);
  });

  it('PATCH /api/orders/[id]/status rejects modifying already delivered order with 422 TERMINAL_STATE', async () => {
    const store = getDataStore();
    // Advance ord-001 along lifecycle: pending -> confirmed -> shipped -> delivered
    await store.updateOrderStatus('ord-001', 'confirmed', 'Validé');
    await store.updateOrderStatus('ord-001', 'shipped', 'Expédié');
    await store.updateOrderStatus('ord-001', 'delivered', 'Livré');

    const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'cancelled',
        note: 'Tentative de modification après livraison',
      }),
    });

    const res = await statusPatch(req, { params: { id: 'ord-001' } });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('TERMINAL_STATE');
  });
});
