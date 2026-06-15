// Export utilities for admin data
export const exportUsersToCSV = (users) => {
  const headers = [
    'Nama',
    'NIM', 
    'Email',
    'Peran',
    'Status',
    'Terverifikasi',
    'Tanggal Daftar',
    'Login Terakhir'
  ];

  const csvContent = [
    headers.join(','),
    ...users.map(user => [
      `"${user.name || ''}"`,
      `"${user.nim || ''}"`,
      `"${user.email || ''}"`,
      `"${user.role || 'STUDENT'}"`,
      `"${user.status || 'ACTIVE'}"`,
      `"${user.isVerified ? 'Ya' : 'Tidak'}"`,
      `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : ''}"`,
      `"${user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleDateString('id-ID') : ''}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportUsersToExcel = async (users) => {
  // This would require a library like xlsx
  // For now, we'll use CSV as a fallback
  const csvContent = exportUsersToCSV(users);
  downloadCSV(csvContent, `users_${new Date().toISOString().split('T')[0]}.csv`);
};

export const generateUserReport = (users) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified && u.status === 'ACTIVE').length,
    deleted: users.filter(u => u.status === 'DELETED').length,
    students: users.filter(u => u.role === 'STUDENT').length,
    admins: users.filter(u => u.role === 'ADMIN').length
  };

  return {
    stats,
    summary: `
Laporan Pengguna - ${new Date().toLocaleDateString('id-ID')}

Total Pengguna: ${stats.total}
- Aktif: ${stats.active}
- Terverifikasi: ${stats.verified}
- Belum Terverifikasi: ${stats.unverified}
- Dihapus: ${stats.deleted}

Berdasarkan Peran:
- Mahasiswa: ${stats.students}
- Admin: ${stats.admins}
    `.trim()
  };
}; 