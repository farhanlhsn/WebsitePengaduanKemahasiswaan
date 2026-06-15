/**
 * Chat access control and broadcast boundary tests.
 */

const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const request = require('supertest');
const {
  prisma,
  buildApp,
  createUser,
  createAdmin,
  createSuperAdmin,
  authHeader,
  createCategory,
  grantCategory,
  issueToken,
} = require('./helpers');
const { setupSocket } = require('../../src/sockets/chatHandler');

let app;
let server;
let io;
let port;

beforeAll(async () => {
  app = buildApp();
  server = http.createServer(app);
  io = setupSocket(server);
  app.set('io', io);
  await new Promise((resolve) => {
    server.listen(0, resolve);
  });
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => {
    io.close();
    server.close(resolve);
  });
});

async function createReport(owner, category) {
  return prisma.report.create({
    data: {
      title: 'Chat Test Report',
      description: 'desc',
      registrationNumber: `REG-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      categoryId: category.id,
      userId: owner.id,
      status: 'PENDING',
    },
  });
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
    setTimeout(() => reject(new Error('socket connect timeout')), 5000);
  });
}

function joinRoom(socket, reportId) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit('joinRoom', { reportId }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

describe('chat access integration', () => {
  test('admin without assignment cannot access report messages', async () => {
    const owner = await createUser({ isVerified: true });
    const admin = await createAdmin();
    const category = await createCategory({ name: 'CatA', slug: 'cat-a' });
    const report = await createReport(owner, category);

    const res = await request(app)
      .get(`/v1/api/chat/reports/${report.id}/messages`)
      .set(authHeader(admin));

    expect(res.status).toBe(403);
  });

  test('assigned admin can access and send message', async () => {
    const owner = await createUser({ isVerified: true });
    const sa = await createSuperAdmin();
    const admin = await createAdmin();
    const category = await createCategory({ name: 'CatB', slug: 'cat-b' });
    await grantCategory(admin.id, category.id, sa.id);
    const report = await createReport(owner, category);

    const getRes = await request(app)
      .get(`/v1/api/chat/reports/${report.id}/messages`)
      .set(authHeader(admin));
    expect(getRes.status).toBe(200);

    const sendRes = await request(app)
      .post(`/v1/api/chat/reports/${report.id}/messages`)
      .set(authHeader(admin))
      .send({ content: 'admin reply' });
    expect(sendRes.status).toBe(201);
  });

  test('student cannot delete admin message', async () => {
    const owner = await createUser({ isVerified: true });
    const sa = await createSuperAdmin();
    const admin = await createAdmin();
    const category = await createCategory({ name: 'CatC', slug: 'cat-c' });
    await grantCategory(admin.id, category.id, sa.id);
    const report = await createReport(owner, category);

    const adminMsg = await prisma.message.create({
      data: { reportId: report.id, senderId: admin.id, content: 'from admin' },
    });

    const res = await request(app)
      .delete(`/v1/api/chat/messages/${adminMsg.id}`)
      .set(authHeader(owner));

    expect(res.status).toBe(403);
  });

  test('REST join endpoint removed', async () => {
    const owner = await createUser({ isVerified: true });
    const category = await createCategory({ name: 'CatD', slug: 'cat-d' });
    const report = await createReport(owner, category);

    const res = await request(app)
      .post(`/v1/api/chat/reports/${report.id}/join`)
      .set(authHeader(owner));

    expect(res.status).toBe(404);
  });

  test('unauthorized socket does not receive chat:message on room broadcast', async () => {
    const ownerA = await createUser({ isVerified: true, email: `a-${Date.now()}@kampus.ac.id` });
    const ownerB = await createUser({ isVerified: true, email: `b-${Date.now()}@kampus.ac.id` });
    const category = await createCategory({ name: 'CatE', slug: 'cat-e' });
    const reportA = await createReport(ownerA, category);
    const reportB = await createReport(ownerB, category);

    const socketA = await connectSocket(issueToken(ownerA));
    const socketB = await connectSocket(issueToken(ownerB));

    const joinA = await joinRoom(socketA, reportA.id);
    const joinB = await joinRoom(socketB, reportB.id);
    expect(joinA.ok).toBe(true);
    expect(joinB.ok).toBe(true);

    const receivedB = [];
    socketB.on('chat:message', (msg) => receivedB.push(msg));

    const receivedA = [];
    socketA.on('chat:message', (msg) => receivedA.push(msg));

    await request(app)
      .post(`/v1/api/chat/reports/${reportA.id}/messages`)
      .set(authHeader(ownerA))
      .send({ content: 'hello from A' })
      .expect(201);

    await new Promise((r) => setTimeout(r, 200));

    expect(receivedA.length).toBe(1);
    expect(receivedB.length).toBe(0);

    socketA.disconnect();
    socketB.disconnect();
  });

  test('SUPERADMIN can join any report room', async () => {
    const owner = await createUser({ isVerified: true });
    const sa = await createSuperAdmin();
    const category = await createCategory({ name: 'CatF', slug: 'cat-f' });
    const report = await createReport(owner, category);

    const socket = await connectSocket(issueToken(sa));
    const result = await joinRoom(socket, report.id);
    expect(result.ok).toBe(true);
    socket.disconnect();
  });
});
