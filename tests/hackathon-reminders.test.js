import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHackathonMessage, classifyFailure, createHackathonWorker, sendHackathonMessage } from '../src/hackathon-reminders.js';

const delivery = { id: 'delivery-1', channel_id_snapshot: '12345678901234567', role_id_snapshot: '12345678901234568',
    content_snapshot: { title: 'Workshop', description: 'Build together', start_time: '2027-03-06T18:00:00Z', location: 'UCF' } };
function setup(overrides = {}) {
    const calls = []; let claimed = false;
    const run = createHackathonWorker({
        claim: async () => { if (claimed) return null; claimed = true; return delivery; },
        finish: async (...args) => calls.push(args), send: async () => ({ id: 'message-1' }),
        report: () => {}, ...overrides,
    });
    return { run, calls };
}
test('message uses actual start time and only the configured role', () => {
    const body = buildHackathonMessage(delivery);
    assert.deepEqual(body.allowed_mentions, { parse: [], roles: [delivery.role_id_snapshot] });
    assert.match(body.content, /starts <t:\d+:R>/);
    assert.doesNotMatch(body.content, /in one hour|@everyone/);
    assert.equal(body.embeds[0].title, 'Workshop');
});
test('successful send records delivered and message ID', async () => {
    const { run, calls } = setup(); await run();
    assert.deepEqual(calls, [['delivery-1', 'delivered', null, 'message-1']]);
});
for (const status of [400, 403, 404, 429]) test(`definite ${status} rejection is retryable`, async () => {
    const { run, calls } = setup({ send: async () => { throw { status }; } }); await run();
    assert.deepEqual(calls, [['delivery-1', 'failed', `discord_${status}`]]);
});
for (const status of [undefined, 500, 502]) test(`ambiguous ${status ?? 'transport'} failure is unknown`, async () => {
    assert.equal(classifyFailure({ status }).state, 'unknown');
    const { run, calls } = setup({ send: async () => { throw { status }; } }); await run();
    assert.deepEqual(calls, [['delivery-1', 'unknown', 'discord_delivery_ambiguous']]);
});
test('completion write failure is unknown even if database error contains a 4xx status', async () => {
    const calls = [];
    const { run } = setup({ finish: async (...args) => {
        calls.push(args); if (args[1] === 'delivered') throw { status: 400 };
    } });
    await run(); assert.equal(calls[1][1], 'unknown');
});
test('failure to record unknown stops worker without sending again', async () => {
    let sends = 0; const reports = [];
    const { run } = setup({ send: async () => { sends++; return { id: 'sent' }; },
        finish: async () => { throw new Error('Database unavailable'); }, report: (...args) => reports.push(args) });
    await run(); assert.equal(sends, 1); assert.ok(reports.length >= 1);
});
test('missing configuration is reported without a fallback destination', async () => {
    const reports = [];
    const { run } = setup({ claim: async () => null, missingConfiguration: async () => ['event-1'],
        report: (...args) => reports.push(args), send: async () => assert.fail('No fallback send') });
    await run(); assert.equal(reports[0][1][0], 'event-1');
});
test('HTTP transport makes exactly one attempt on an ambiguous response', async t => {
    let count = 0;
    t.mock.method(globalThis, 'fetch', async () => { count++; return { ok: false, status: 503 }; });
    await assert.rejects(sendHackathonMessage(delivery.channel_id_snapshot, buildHackathonMessage(delivery)));
    assert.equal(count, 1);
});
