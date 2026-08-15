/**
 * Tests for AN-5 — service-level immutability guard for `isAnonymous`,
 * `userId`, and `registrationNumber`. The guard runs on the assembled update
 * payload so that any future generic update endpoint that forgets to whitelist
 * fields will fail fast instead of silently mutating sensitive fields.
 */

// Avoid pulling Prisma client into the test runtime — we only exercise the
// pure helper, not any DB-touching method.
jest.mock('../../../src/utils/prisma', () => ({}));
jest.mock('../../../src/utils/softDelete', () => ({}));
jest.mock('../../../src/utils/registrationGenerator', () => ({}));

const reportServices = require('../../../src/services/reportServices');

describe('reportServices.assertImmutableFieldsNotMutated', () => {
  test('does not throw for empty / null / non-object input', () => {
    expect(() => reportServices.assertImmutableFieldsNotMutated(undefined)).not.toThrow();
    expect(() => reportServices.assertImmutableFieldsNotMutated(null)).not.toThrow();
    expect(() => reportServices.assertImmutableFieldsNotMutated({})).not.toThrow();
    expect(() => reportServices.assertImmutableFieldsNotMutated('string')).not.toThrow();
  });

  test('does not throw when only whitelisted fields are present', () => {
    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({
        title: 'New title',
        description: 'New body',
        categoryId: 5,
        status: 'IN_REVIEW',
        priority: 'HIGH',
      })
    ).not.toThrow();
  });

  test('throws if isAnonymous is included in the update payload', () => {
    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({ title: 'x', isAnonymous: true })
    ).toThrow(/isAnonymous.*immutable/);

    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({ isAnonymous: false })
    ).toThrow(/isAnonymous.*immutable/);
  });

  test('throws if userId is included in the update payload', () => {
    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({ userId: 99 })
    ).toThrow(/userId.*immutable/);
  });

  test('throws if registrationNumber is included in the update payload', () => {
    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({ registrationNumber: 'KKR-2026-0001' })
    ).toThrow(/registrationNumber.*immutable/);
  });

  test('throws on the FIRST immutable field encountered', () => {
    // Multiple immutable fields → only the first error matters.
    expect(() =>
      reportServices.assertImmutableFieldsNotMutated({
        isAnonymous: true,
        userId: 5,
      })
    ).toThrow(/isAnonymous.*immutable/);
  });

  test('IMMUTABLE_FIELDS list is frozen and contains exactly the documented fields', () => {
    expect(reportServices.IMMUTABLE_FIELDS).toEqual(['isAnonymous', 'userId', 'registrationNumber']);
    expect(Object.isFrozen(reportServices.IMMUTABLE_FIELDS)).toBe(true);
  });
});
