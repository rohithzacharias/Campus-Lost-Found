/**
 * Automated test suite for CampusFind Backend API
 * Tests health, auth, lost items, found items, ownership security, and dashboard stats.
 */

process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const http = require('http');
const mongoose = require('mongoose');
const app = require('./index');
const User = require('./models/User');
const LostItem = require('./models/LostItem');
const FoundItem = require('./models/FoundItem');

let server;
let baseUrl;

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   Running CampusFind Backend Automated Test Suite');
  console.log('======================================================\n');

  // Start HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  // Ensure DB is connected
  if (mongoose.connection.readyState !== 1) {
    await new Promise(resolve => {
      mongoose.connection.once('open', resolve);
    });
  }

  const testEmail1 = `test_student_${Date.now()}@campus.edu`;
  const testEmail2 = `test_other_${Date.now()}@campus.edu`;
  const testPassword = 'Password123!';

  let token1 = null;
  let user1Id = null;
  let token2 = null;
  let user2Id = null;
  let createdLostId = null;
  let createdFoundId = null;

  try {
    // 1. Health check
    console.log('\n--- 1. Testing Health Endpoint ---');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Health endpoint returns 200');
    assert(healthRes.body.database.connected === true, 'Database is connected');

    // 2. Auth: Registration validation
    console.log('\n--- 2. Testing Registration & Validation ---');
    const invalidEmailRes = await request('POST', '/api/auth/register', {
      name: 'Test',
      email: 'invalid-email',
      password: testPassword
    });
    assert(invalidEmailRes.status === 400, 'Rejects invalid email format');

    const shortPassRes = await request('POST', '/api/auth/register', {
      name: 'Test',
      email: testEmail1,
      password: 'short'
    });
    assert(shortPassRes.status === 400, 'Rejects password shorter than 8 characters');

    // 3. Auth: Successful registration
    console.log('\n--- 3. Testing Successful User Registration ---');
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Alice Student',
      email: testEmail1,
      password: testPassword,
      confirmPassword: testPassword
    });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.body.success === true, 'Registration reports success');
    assert(regRes.body.user.email === testEmail1, 'Returns correct email');
    assert(!regRes.body.user.password, 'Does not return password hash');
    assert(!!regRes.body.token, 'Returns JWT authentication token');
    token1 = regRes.body.token;
    user1Id = regRes.body.user._id;

    // Register second user for ownership tests
    const reg2Res = await request('POST', '/api/auth/register', {
      name: 'Bob Student',
      email: testEmail2,
      password: testPassword
    });
    token2 = reg2Res.body.token;
    user2Id = reg2Res.body.user._id;
    assert(!!token2, 'Second user registered successfully');

    // 4. Auth: Duplicate registration prevention
    console.log('\n--- 4. Testing Duplicate Email Prevention ---');
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Duplicate Alice',
      email: testEmail1,
      password: testPassword
    });
    assert(dupRes.status === 409 || dupRes.status === 400, 'Rejects duplicate registration with 409/400');

    // 5. Auth: Login checks
    console.log('\n--- 5. Testing Login ---');
    const badLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail1,
      password: 'wrong_password'
    });
    assert(badLoginRes.status === 401, 'Rejects incorrect password with 401');

    const goodLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail1,
      password: testPassword
    });
    assert(goodLoginRes.status === 200, 'Valid login returns 200');
    assert(!!goodLoginRes.body.token, 'Valid login returns token');

    // 6. Auth: Protected /api/auth/me
    console.log('\n--- 6. Testing Protected Session ---');
    const noTokenRes = await request('GET', '/api/auth/me');
    assert(noTokenRes.status === 401, 'Rejects missing auth header with 401');

    const meRes = await request('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${token1}`
    });
    assert(meRes.status === 200, '/api/auth/me succeeds with valid token');
    assert(meRes.body.user.email === testEmail1, 'Profile matches authenticated user');

    // 7. Lost Items: Creation
    console.log('\n--- 7. Testing Lost Item Creation ---');
    const lostRes = await request('POST', '/api/lost', {
      itemName: 'Blue Hydroflask Water Bottle',
      category: 'Other',
      description: 'Navy blue 32oz bottle with campus stickers',
      distinguishingFeatures: 'Dent on the bottom and a CS club sticker',
      lastSeenLocation: 'Library 2nd Floor Study Room',
      lastSeenDate: '2026-10-27T10:00:00.000Z'
    }, {
      Authorization: `Bearer ${token1}`
    });
    assert(lostRes.status === 201, 'Creates lost item report with 201');
    assert(lostRes.body.item.status === 'open', 'Defaults status to open');
    assert(lostRes.body.item.reportedBy._id === user1Id, 'Associates report with user 1');
    createdLostId = lostRes.body.item._id;

    // 8. Lost Items: Retrieval & Search
    console.log('\n--- 8. Testing Lost Items Retrieval & Search ---');
    const listLostRes = await request('GET', '/api/lost?q=Hydroflask');
    assert(listLostRes.status === 200, 'Search by keyword returns 200');
    assert(listLostRes.body.items.some(i => i._id === createdLostId), 'Found created item in search results');

    // 9. Lost Items: Ownership Security on Update
    console.log('\n--- 9. Testing Lost Item Ownership Security ---');
    const unauthorizedUpdateRes = await request('PUT', `/api/lost/${createdLostId}`, {
      itemName: 'Hacked Title'
    }, {
      Authorization: `Bearer ${token2}` // User 2 trying to update User 1's report
    });
    assert(unauthorizedUpdateRes.status === 403, 'Rejects update by non-owner with 403');

    const authorizedUpdateRes = await request('PUT', `/api/lost/${createdLostId}`, {
      itemName: 'Updated Blue Hydroflask Bottle',
      category: 'Other',
      description: 'Navy blue 32oz bottle with campus stickers - updated',
      distinguishingFeatures: 'Dent on the bottom and a CS club sticker',
      lastSeenLocation: 'Library 3rd Floor',
      lastSeenDate: '2026-10-27T10:00:00.000Z'
    }, {
      Authorization: `Bearer ${token1}`
    });
    assert(authorizedUpdateRes.status === 200, 'Allows update by legitimate owner');
    assert(authorizedUpdateRes.body.item.itemName === 'Updated Blue Hydroflask Bottle', 'Item name successfully updated');

    // 10. Lost Items: Status Transition
    console.log('\n--- 10. Testing Lost Item Status Transition ---');
    const statusRes = await request('PATCH', `/api/lost/${createdLostId}/status`, {
      status: 'resolved'
    }, {
      Authorization: `Bearer ${token1}`
    });
    assert(statusRes.status === 200, 'Status update to resolved succeeds');
    assert(statusRes.body.item.status === 'resolved', 'Status changed to resolved');
    assert(statusRes.body.item.statusHistory.length >= 2, 'Status history tracks transitions');

    // 11. Found Items: Creation & Privacy
    console.log('\n--- 11. Testing Found Item Creation ---');
    const foundRes = await request('POST', '/api/found', {
      itemName: 'TI-84 Plus Graphing Calculator',
      category: 'Electronics',
      description: 'Black calculator found on lecture desk in Hall B',
      distinguishingFeatures: 'Yellow name sticker on back with initial R',
      foundLocation: 'Science Building Hall B',
      foundDate: '2026-10-28T09:30:00.000Z',
      contactName: 'Alice Finder',
      contactEmail: testEmail1,
      contactPhone: '555-0199'
    }, {
      Authorization: `Bearer ${token1}`
    });
    assert(foundRes.status === 201, 'Creates found item report with 201');
    createdFoundId = foundRes.body.item._id;

    // 12. Found Items: Status Transition
    console.log('\n--- 12. Testing Found Item Status Transition ---');
    const foundStatusRes = await request('PATCH', `/api/found/${createdFoundId}/status`, {
      status: 'returned'
    }, {
      Authorization: `Bearer ${token1}`
    });
    assert(foundStatusRes.status === 200, 'Status update to returned succeeds');
    assert(foundStatusRes.body.item.status === 'returned', 'Found item marked as returned');

    // 13. My Reports Dashboard
    console.log('\n--- 13. Testing My Reports Dashboard ---');
    const myReportsRes = await request('GET', '/api/users/me/reports', null, {
      Authorization: `Bearer ${token1}`
    });
    assert(myReportsRes.status === 200, 'My Reports returns 200');
    assert(myReportsRes.body.myLostItems.length >= 1, 'Includes user 1 lost reports');
    assert(myReportsRes.body.myFoundItems.length >= 1, 'Includes user 1 found reports');

    // 14. Dashboard Stats
    console.log('\n--- 14. Testing Dashboard Statistics ---');
    const statsRes = await request('GET', '/api/dashboard/stats', null, {
      Authorization: `Bearer ${token1}`
    });
    assert(statsRes.status === 200, 'Dashboard stats returns 200');
    assert(typeof statsRes.body.stats.totalReclaimed === 'number', 'Reports total reclaimed items');
    assert(Array.isArray(statsRes.body.recentLost), 'Returns recent lost items array');
    assert(Array.isArray(statsRes.body.recentFound), 'Returns recent found items array');

    // 15. Delete & Cleanup
    console.log('\n--- 15. Testing Deletion & Ownership Security ---');
    const unauthDeleteRes = await request('DELETE', `/api/lost/${createdLostId}`, null, {
      Authorization: `Bearer ${token2}`
    });
    assert(unauthDeleteRes.status === 403, 'Prevents deleting another user report');

    const authDeleteRes = await request('DELETE', `/api/lost/${createdLostId}`, null, {
      Authorization: `Bearer ${token1}`
    });
    assert(authDeleteRes.status === 200, 'Allows owner to delete lost report');

    const deleteFoundRes = await request('DELETE', `/api/found/${createdFoundId}`, null, {
      Authorization: `Bearer ${token1}`
    });
    assert(deleteFoundRes.status === 200, 'Allows owner to delete found report');

    console.log('\n======================================================');
    console.log('   ALL BACKEND TESTS PASSED SUCCESSFULLY! (15/15)     ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    throw err;
  } finally {
    // Clean up test users
    if (user1Id) await User.findByIdAndDelete(user1Id);
    if (user2Id) await User.findByIdAndDelete(user2Id);
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
