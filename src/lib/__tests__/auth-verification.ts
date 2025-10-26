/**
 * Authentication and Authorization System Verification
 * 
 * This script verifies that all components of the authentication and authorization
 * system are properly integrated and working together.
 */

import { RBACService } from '../rbac'
import { DepartmentFilterService } from '../department-filter'
import { JWTPayload } from '@/types/auth'

// Test users for verification
const testUsers: JWTPayload[] = [
  {
    id: '507f1f77bcf86cd799439011',
    email: 'admin@kti.com',
    role: 'admin',
    department: 'IT',
    permissions: ['all'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  },
  {
    id: '507f1f77bcf86cd799439012',
    email: 'spoc@kti.com',
    role: 'spoc',
    department: 'Finance',
    permissions: ['assets:read', 'assets:update', 'workflows:create', 'workflows:approve', 'reports:read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  },
  {
    id: '507f1f77bcf86cd799439013',
    email: 'user@kti.com',
    role: 'user',
    department: 'HR',
    permissions: ['assets:read', 'workflows:read', 'reports:read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }
]

/**
 * Verify RBAC permissions
 */
function verifyRBACPermissions(): boolean {
  console.log('🔐 Verifying RBAC Permissions...')
  
  const tests = [
    // Admin permissions
    { user: 'admin', resource: 'assets', action: 'create', expected: true },
    { user: 'admin', resource: 'assets', action: 'delete', expected: true },
    { user: 'admin', resource: 'users', action: 'create', expected: true },
    { user: 'admin', resource: 'workflows', action: 'approve', expected: true },
    
    // SPOC permissions
    { user: 'spoc', resource: 'assets', action: 'read', expected: true },
    { user: 'spoc', resource: 'assets', action: 'update', expected: true },
    { user: 'spoc', resource: 'assets', action: 'create', expected: false },
    { user: 'spoc', resource: 'assets', action: 'delete', expected: false },
    { user: 'spoc', resource: 'workflows', action: 'approve', expected: true },
    { user: 'spoc', resource: 'users', action: 'create', expected: false },
    
    // User permissions
    { user: 'user', resource: 'assets', action: 'read', expected: true },
    { user: 'user', resource: 'assets', action: 'update', expected: false },
    { user: 'user', resource: 'assets', action: 'create', expected: false },
    { user: 'user', resource: 'workflows', action: 'read', expected: true },
    { user: 'user', resource: 'workflows', action: 'approve', expected: false },
    { user: 'user', resource: 'users', action: 'create', expected: false }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    const result = RBACService.hasPermission(test.user as any, test.resource, test.action)
    if (result === test.expected) {
      passed++
      console.log(`  ✅ ${test.user} ${test.action} ${test.resource}: ${result}`)
    } else {
      failed++
      console.log(`  ❌ ${test.user} ${test.action} ${test.resource}: expected ${test.expected}, got ${result}`)
    }
  })
  
  console.log(`  📊 RBAC Tests: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Verify department access control
 */
function verifyDepartmentAccess(): boolean {
  console.log('\n🏢 Verifying Department Access Control...')
  
  const tests = [
    // Admin can access all departments
    { user: testUsers[0], targetDept: 'Finance', expected: true },
    { user: testUsers[0], targetDept: 'HR', expected: true },
    { user: testUsers[0], targetDept: 'IT', expected: true },
    
    // SPOC can only access own department
    { user: testUsers[1], targetDept: 'Finance', expected: true },
    { user: testUsers[1], targetDept: 'HR', expected: false },
    { user: testUsers[1], targetDept: 'IT', expected: false },
    
    // User can only access own department
    { user: testUsers[2], targetDept: 'HR', expected: true },
    { user: testUsers[2], targetDept: 'Finance', expected: false },
    { user: testUsers[2], targetDept: 'IT', expected: false }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    const result = RBACService.canAccessDepartment(test.user.role, test.user.department, test.targetDept)
    if (result === test.expected) {
      passed++
      console.log(`  ✅ ${test.user.role} access to ${test.targetDept}: ${result}`)
    } else {
      failed++
      console.log(`  ❌ ${test.user.role} access to ${test.targetDept}: expected ${test.expected}, got ${result}`)
    }
  })
  
  console.log(`  📊 Department Access Tests: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Verify department filtering
 */
function verifyDepartmentFiltering(): boolean {
  console.log('\n🔍 Verifying Department Filtering...')
  
  let passed = 0
  let failed = 0
  
  // Test department filters
  testUsers.forEach(user => {
    const filter = RBACService.getDepartmentFilter(user.role, user.department)
    
    if (user.role === 'admin') {
      if (filter === null) {
        passed++
        console.log(`  ✅ ${user.role} filter: null (all departments)`)
      } else {
        failed++
        console.log(`  ❌ ${user.role} filter: expected null, got ${JSON.stringify(filter)}`)
      }
    } else {
      const expected = { department: user.department }
      if (JSON.stringify(filter) === JSON.stringify(expected)) {
        passed++
        console.log(`  ✅ ${user.role} filter: ${JSON.stringify(filter)}`)
      } else {
        failed++
        console.log(`  ❌ ${user.role} filter: expected ${JSON.stringify(expected)}, got ${JSON.stringify(filter)}`)
      }
    }
  })
  
  console.log(`  📊 Department Filter Tests: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Verify API access validation
 */
function verifyAPIAccess(): boolean {
  console.log('\n🌐 Verifying API Access Validation...')
  
  const tests = [
    // Admin access
    { user: testUsers[0], resource: 'assets', action: 'create', expected: true },
    { user: testUsers[0], resource: 'users', action: 'delete', expected: true },
    
    // SPOC access
    { user: testUsers[1], resource: 'assets', action: 'read', expected: true },
    { user: testUsers[1], resource: 'assets', action: 'delete', expected: false },
    { user: testUsers[1], resource: 'workflows', action: 'approve', expected: true },
    
    // User access
    { user: testUsers[2], resource: 'assets', action: 'read', expected: true },
    { user: testUsers[2], resource: 'assets', action: 'update', expected: false },
    { user: testUsers[2], resource: 'workflows', action: 'approve', expected: false }
  ]
  
  let passed = 0
  let failed = 0
  
  tests.forEach(test => {
    const result = RBACService.validateApiAccess(test.user, test.resource, test.action)
    if (result.allowed === test.expected) {
      passed++
      console.log(`  ✅ ${test.user.role} ${test.action} ${test.resource}: ${result.allowed}`)
    } else {
      failed++
      console.log(`  ❌ ${test.user.role} ${test.action} ${test.resource}: expected ${test.expected}, got ${result.allowed}`)
      if (result.reason) {
        console.log(`      Reason: ${result.reason}`)
      }
    }
  })
  
  console.log(`  📊 API Access Tests: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Verify department filtering service
 */
function verifyDepartmentFilteringService(): boolean {
  console.log('\n🏭 Verifying Department Filtering Service...')
  
  let passed = 0
  let failed = 0
  
  // Test asset access
  const testAsset = { department: 'Finance' }
  
  testUsers.forEach(user => {
    const canAccess = DepartmentFilterService.canAccessAsset(testAsset, user)
    const expected = user.role === 'admin' || user.department === 'Finance'
    
    if (canAccess === expected) {
      passed++
      console.log(`  ✅ ${user.role} can access Finance asset: ${canAccess}`)
    } else {
      failed++
      console.log(`  ❌ ${user.role} can access Finance asset: expected ${expected}, got ${canAccess}`)
    }
  })
  
  // Test frontend department filter
  testUsers.forEach(user => {
    const frontendFilter = DepartmentFilterService.getFrontendDepartmentFilter(user)
    
    if (user.role === 'admin') {
      if (frontendFilter.showAllDepartments === true) {
        passed++
        console.log(`  ✅ ${user.role} frontend filter: shows all departments`)
      } else {
        failed++
        console.log(`  ❌ ${user.role} frontend filter: should show all departments`)
      }
    } else {
      if (frontendFilter.showAllDepartments === false && 
          frontendFilter.currentDepartment === user.department) {
        passed++
        console.log(`  ✅ ${user.role} frontend filter: limited to ${user.department}`)
      } else {
        failed++
        console.log(`  ❌ ${user.role} frontend filter: incorrect configuration`)
      }
    }
  })
  
  console.log(`  📊 Department Filtering Service Tests: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Run all verification tests
 */
export function runAuthVerification(): boolean {
  console.log('🚀 Starting Authentication & Authorization System Verification\n')
  
  const results = [
    verifyRBACPermissions(),
    verifyDepartmentAccess(),
    verifyDepartmentFiltering(),
    verifyAPIAccess(),
    verifyDepartmentFilteringService()
  ]
  
  const allPassed = results.every(result => result)
  
  console.log('\n📋 Verification Summary:')
  console.log(`  RBAC Permissions: ${results[0] ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Department Access: ${results[1] ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Department Filtering: ${results[2] ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  API Access Validation: ${results[3] ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Department Filtering Service: ${results[4] ? '✅ PASS' : '❌ FAIL'}`)
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  
  if (allPassed) {
    console.log('\n🎉 Authentication & Authorization System is fully functional!')
    console.log('✨ All components are properly integrated and working together.')
  } else {
    console.log('\n⚠️  Some components need attention.')
  }
  
  return allPassed
}

// Run verification if this file is executed directly
if (require.main === module) {
  runAuthVerification()
}