import { describe, it, expect } from 'vitest';
import { getHelpContent, getResourceLinks } from '../../src/pages/help/helpContent';

const allText = (faqs) => faqs.map((f) => `${f.question} ${f.answer}`).join(' ').toLowerCase();

describe('getHelpContent', () => {
  it('memberi FAQ mahasiswa secara default', () => {
    const { faqs } = getHelpContent();
    expect(faqs.some((f) => /membuat laporan/i.test(f.question))).toBe(true);
    expect(faqs.some((f) => /anonim/i.test(f.question))).toBe(true);
  });

  it('memberi FAQ khusus admin, bukan FAQ mahasiswa', () => {
    const { faqs } = getHelpContent('admin');
    const text = allText(faqs);
    expect(text).toContain('penugasan kategori');
    expect(text).toContain('verifikasi');
    expect(faqs.some((f) => /cara membuat laporan/i.test(f.question))).toBe(false);
  });

  it('tidak lagi memuat klaim yang tidak sesuai sistem', () => {
    const text = allText(getHelpContent('mahasiswa').faqs);
    expect(text).not.toContain('fakultas');
    expect(text).not.toContain('verifikasi email');
    expect(text).not.toContain('24 jam');
    expect(text).toContain('ktm');
  });

  it('setiap kategori FAQ punya label', () => {
    for (const audience of ['mahasiswa', 'admin']) {
      const { faqs, categoryLabels } = getHelpContent(audience);
      for (const faq of faqs) {
        expect(categoryLabels[faq.category], `${audience}:${faq.category}`).toBeTruthy();
      }
    }
  });
});

describe('getResourceLinks', () => {
  it('kosong bila URL tidak diatur', () => {
    expect(getResourceLinks({})).toEqual([]);
    expect(getResourceLinks({ VITE_USER_MANUAL_URL: '  ', VITE_PRIVACY_POLICY_URL: '' })).toEqual([]);
  });

  it('menampilkan tautan yang diatur', () => {
    const links = getResourceLinks({
      VITE_USER_MANUAL_URL: 'https://kampus.ac.id/panduan.pdf',
      VITE_PRIVACY_POLICY_URL: '/kebijakan-privasi.pdf',
    });
    expect(links.map((l) => l.key)).toEqual(['manual', 'privacy']);
    expect(links[0].href).toBe('https://kampus.ac.id/panduan.pdf');
    expect(links[1].href).toBe('/kebijakan-privasi.pdf');
  });

  it('menolak skema URL selain http(s) dan path relatif', () => {
    expect(getResourceLinks({ VITE_USER_MANUAL_URL: 'javascript:alert(1)' })).toEqual([]);
    expect(getResourceLinks({ VITE_USER_MANUAL_URL: '//evil.example/x' })).toEqual([]);
  });
});
