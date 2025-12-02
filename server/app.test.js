import request from 'supertest';
import app from './app.js';
import { connection } from './database/connection.js';

// Helper to clean up test data
const cleanupTestUser = (email) => {
  return new Promise((resolve) => {
    connection.execute('DELETE FROM user_info WHERE u_email = ?', [email], () => {
      resolve();
    });
  });
};

const cleanupTestAdvising = (userId) => {
  return new Promise((resolve) => {
    connection.execute('DELETE FROM advising_entries WHERE user_id = ?', [userId], () => {
      resolve();
    });
  });
};

describe('Course Advising API Tests', () => {
  
  // Test 1: User Registration with Valid Data
  describe('POST /user/register', () => {
    const testEmail = 'test-user-' + Date.now() + '@example.com';
    
    afterAll(async () => {
      await cleanupTestUser(testEmail);
    });

    it('should successfully register a new user with valid data', async () => {
      const response = await request(app)
        .post('/user/register')
        .send({
          u_firstname: 'Test',
          u_lastname: 'User',
          u_email: testEmail,
          u_password: 'Test@123456'  // Valid password: 8+ chars, uppercase, lowercase, number, special
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Registration successful');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/user/register')
        .send({
          u_firstname: 'Test',
          u_lastname: 'User',
          u_email: 'weakpass@example.com',
          u_password: 'weak'  // Too short, missing requirements
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/user/register')
        .send({
          u_email: 'incomplete@example.com',
          u_password: 'Test@123456'
          // Missing firstname and lastname
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  // Test 2: User Login with Incorrect Password
  describe('POST /user/login', () => {
    const testEmail = 'login-test-' + Date.now() + '@example.com';
    let testUserId;

    beforeAll(async () => {
      // Register a verified user for testing
      await request(app)
        .post('/user/register')
        .send({
          u_firstname: 'Login',
          u_lastname: 'Test',
          u_email: testEmail,
          u_password: 'Correct@123'
        });

      // Manually verify the user in database
      await new Promise((resolve) => {
        connection.execute(
          'UPDATE user_info SET is_verified = 1 WHERE u_email = ?',
          [testEmail],
          (err, result) => {
            // Get user ID for cleanup
            connection.execute('SELECT u_id FROM user_info WHERE u_email = ?', [testEmail], (err2, result2) => {
              testUserId = result2[0]?.u_id;
              resolve();
            });
          }
        );
      });
    });

    afterAll(async () => {
      await cleanupTestUser(testEmail);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/user/login')
        .send({
          email: testEmail,
          password: 'WrongPassword@123',
          recaptchaToken: 'test-token'  // Mock token for testing
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/user/login')
        .send({
          email: testEmail
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  // Test 3: Advising Entry Creation
  describe('POST /advising', () => {
    const testEmail = 'advising-test-' + Date.now() + '@example.com';
    let testUserId;

    beforeAll(async () => {
      // Register and verify a user
      await request(app)
        .post('/user/register')
        .send({
          u_firstname: 'Advising',
          u_lastname: 'Test',
          u_email: testEmail,
          u_password: 'Advising@123'
        });

      // Verify user and get ID
      await new Promise((resolve) => {
        connection.execute(
          'UPDATE user_info SET is_verified = 1 WHERE u_email = ?',
          [testEmail],
          () => {
            connection.execute('SELECT u_id FROM user_info WHERE u_email = ?', [testEmail], (err, result) => {
              testUserId = result[0]?.u_id;
              resolve();
            });
          }
        );
      });
    });

    afterAll(async () => {
      await cleanupTestAdvising(testUserId);
      await cleanupTestUser(testEmail);
    });

    it('should successfully create an advising entry', async () => {
      const response = await request(app)
        .post('/advising')
        .send({
          userId: testUserId,
          current_term: 'Spring 2026',
          last_term: 'Fall 2025',
          last_gpa: '3.5',
          courses: [
            { level: 'CSC 101', course_name: 'Intro to CS' },
            { level: 'MTH 161', course_name: 'Calculus I' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.advisingId).toBeDefined();
    });

    it('should reject advising entry with missing user_id', async () => {
      const response = await request(app)
        .post('/advising')
        .send({
          current_term: 'Spring 2026',
          courses: [
            { level: 'CSC 101', course_name: 'Intro to CS' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('userId');
    });

    it('should create advising entry even with empty courses array', async () => {
      const response = await request(app)
        .post('/advising')
        .send({
          userId: testUserId,
          current_term: 'Spring 2026',
          courses: []  // Empty courses is allowed
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.advisingId).toBeDefined();
    });
  });

  // Test endpoint availability
  describe('GET /test', () => {
    it('should respond to health check', async () => {
      const response = await request(app).get('/test');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });
  });
});

// Close database connection after all tests
afterAll((done) => {
  connection.end(() => {
    done();
  });
});
