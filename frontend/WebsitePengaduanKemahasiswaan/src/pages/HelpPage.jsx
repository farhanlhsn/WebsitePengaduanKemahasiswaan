import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Paper, Stack,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent,
  Chip, Divider, List, ListItem, ListItemIcon, ListItemText,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Avatar, Alert
} from '@mui/material';
import {
  ArrowBack, ExpandMore, HelpOutline, QuestionAnswer, Book,
  ContactSupport, Phone, Email, LocationOn, Schedule, WhatsApp,
  Telegram, Facebook, Instagram, Search, PlayArrow, Download,
  School, Assignment, Security, AccountCircle, Notifications,
  Settings, BugReport, Feedback, Send, AttachFile
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const HelpPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactDialog, setContactDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'umum'
  });

  // FAQ Data
  const faqData = [
    {
      category: 'umum',
      question: 'Apa itu portal pengaduan mahasiswa Universitas Bung Hatta?',
      answer: 'Portal pengaduan adalah platform digital yang memungkinkan mahasiswa untuk menyampaikan keluhan, saran, atau laporan terkait kehidupan kampus seperti fasilitas, akademik, administrasi, dan layanan kampus lainnya secara mudah dan transparan.',
      tags: ['portal', 'pengaduan', 'universitas']
    },
    {
      category: 'umum',
      question: 'Siapa saja yang bisa menggunakan portal ini?',
      answer: 'Portal ini khusus untuk mahasiswa aktif Universitas Bung Hatta. Anda perlu memiliki NIM dan email yang valid untuk dapat mendaftar dan menggunakan layanan ini.',
      tags: ['mahasiswa', 'akses', 'syarat']
    },
    {
      category: 'akun',
      question: 'Bagaimana cara mendaftar akun baru?',
      answer: 'Klik tombol "Daftar" di halaman utama, isi formulir pendaftaran dengan data diri yang valid (nama, email, NIM, fakultas), lalu verifikasi email Anda. Akun akan diaktifkan setelah diverifikasi oleh admin.',
      tags: ['registrasi', 'akun', 'daftar']
    },
    {
      category: 'akun',
      question: 'Saya lupa password, bagaimana cara reset?',
      answer: 'Klik "Lupa Password" di halaman login, masukkan email yang terdaftar. Anda akan menerima link reset password melalui email. Ikuti instruksi dalam email untuk membuat password baru.',
      tags: ['password', 'reset', 'lupa']
    },
    {
      category: 'laporan',
      question: 'Bagaimana cara membuat laporan pengaduan?',
      answer: 'Setelah login, klik "Buat Laporan" di dashboard. Pilih kategori yang sesuai, isi deskripsi masalah secara detail, lampirkan bukti pendukung jika ada, lalu submit. Laporan akan masuk ke sistem untuk diproses.',
      tags: ['laporan', 'pengaduan', 'membuat']
    },
    {
      category: 'laporan',
      question: 'Berapa lama waktu respon untuk laporan saya?',
      answer: 'Tim kami akan merespon laporan dalam waktu maksimal 24 jam kerja. Untuk masalah urgent, biasanya direspon dalam 2-4 jam. Status laporan dapat dipantau melalui dashboard.',
      tags: ['respon', 'waktu', 'status']
    },
    {
      category: 'laporan',
      question: 'Apa saja kategori laporan yang tersedia?',
      answer: 'Kategori laporan meliputi: Akademik (nilai, jadwal kuliah), Fasilitas (ruang kelas, laboratorium), Administrasi (pembayaran, surat-menyurat), Teknologi Informasi (sistem, website), dan Lainnya.',
      tags: ['kategori', 'jenis', 'laporan']
    },
    {
      category: 'teknis',
      question: 'Website tidak bisa diakses atau loading lambat',
      answer: 'Coba refresh halaman atau bersihkan cache browser. Pastikan koneksi internet stabil. Jika masih bermasalah, coba akses menggunakan browser lain atau hubungi tim IT.',
      tags: ['website', 'loading', 'akses']
    },
    {
      category: 'teknis',
      question: 'File yang saya upload tidak muncul atau gagal',
      answer: 'Pastikan file berformat yang didukung (PDF, JPG, PNG, DOC) dan ukuran maksimal 5MB. Periksa koneksi internet saat upload. Jika masih gagal, coba kompres file atau hubungi support.',
      tags: ['upload', 'file', 'gagal']
    },
    {
      category: 'privasi',
      question: 'Apakah laporan saya bersifat rahasia?',
      answer: 'Ya, semua laporan dijaga kerahasiaannya. Hanya admin yang berwenang dan pihak terkait yang dapat mengakses detail laporan. Data pribadi Anda dilindungi sesuai kebijakan privasi universitas.',
      tags: ['privasi', 'rahasia', 'keamanan']
    },
    {
      category: 'privasi',
      question: 'Bisakah saya menghapus laporan yang sudah dibuat?',
      answer: 'Laporan yang sudah disubmit tidak dapat dihapus secara otomatis. Namun, Anda dapat menghubungi admin melalui fitur kontak atau membuat laporan follow-up untuk memberikan clarifikasi.',
      tags: ['hapus', 'laporan', 'edit']
    },
    {
      category: 'notifikasi',
      question: 'Bagaimana cara mengatur notifikasi?',
      answer: 'Masuk ke menu Pengaturan > Notifikasi. Anda dapat mengatur preferensi untuk email notifikasi, push notification, dan jenis update yang ingin Anda terima.',
      tags: ['notifikasi', 'pengaturan', 'email']
    }
  ];

  // Quick Guide Steps
  const quickGuide = [
    {
      step: 1,
      title: 'Daftar & Verifikasi',
      description: 'Buat akun dengan data valid dan verifikasi email',
      icon: <AccountCircle color="primary" />
    },
    {
      step: 2,
      title: 'Login ke Dashboard',
      description: 'Masuk ke akun dan akses dashboard mahasiswa',
      icon: <School color="primary" />
    },
    {
      step: 3,
      title: 'Buat Laporan',
      description: 'Klik "Buat Laporan" dan isi formulir dengan lengkap',
      icon: <Assignment color="primary" />
    },
    {
      step: 4,
      title: 'Pantau Status',
      description: 'Cek status laporan dan respon dari admin secara berkala',
      icon: <Notifications color="primary" />
    }
  ];

  // Contact Methods
  const contactMethods = [
    {
      type: 'phone',
      title: 'Telepon',
      value: '(0751) 461208',
      description: 'Senin - Jumat, 08:00 - 17:00 WIB',
      icon: <Phone />,
      action: () => window.open('tel:+6275146120')
    },
    {
      type: 'email',
      title: 'Email',
      value: 'pengaduan@bunghatta.ac.id',
      description: 'Respon dalam 24 jam',
      icon: <Email />,
      action: () => window.open('mailto:pengaduan@bunghatta.ac.id')
    },
    {
      type: 'whatsapp',
      title: 'WhatsApp',
      value: '+62 751 461208',
      description: 'Chat langsung dengan admin',
      icon: <WhatsApp />,
      action: () => window.open('https://wa.me/6275146120')
    },
    {
      type: 'location',
      title: 'Kunjungi Langsung',
      value: 'Gedung Rektorat Lt. 2',
      description: 'Jl. Bagindo Aziz Chan No. 8, Padang',
      icon: <LocationOn />,
      action: () => window.open('https://maps.google.com/?q=Universitas+Bung+Hatta+Padang')
    }
  ];

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'Semua', count: faqData.length },
    { id: 'umum', label: 'Umum', count: faqData.filter(item => item.category === 'umum').length },
    { id: 'akun', label: 'Akun & Login', count: faqData.filter(item => item.category === 'akun').length },
    { id: 'laporan', label: 'Laporan', count: faqData.filter(item => item.category === 'laporan').length },
    { id: 'teknis', label: 'Teknis', count: faqData.filter(item => item.category === 'teknis').length },
    { id: 'privasi', label: 'Privasi', count: faqData.filter(item => item.category === 'privasi').length },
    { id: 'notifikasi', label: 'Notifikasi', count: faqData.filter(item => item.category === 'notifikasi').length }
  ];

  // Filter FAQ based on search and category
  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = () => {
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    setContactDialog(false);
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'umum'
    });
    alert('Pesan Anda telah dikirim. Tim kami akan merespon segera.');
  };

  const handleInputChange = (field) => (event) => {
    setContactForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', py: 4 }}>
      {/* Back Button */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, px: 10 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
          variant="outlined"
          sx={{ 
            color: 'black',
            borderColor: 'rgba(0,0,0,0.3)',
            '&:hover': {
              borderColor: 'black',
              bgcolor: 'rgba(0,0,0,0.1)'
            }
          }}
        >
          Kembali
        </Button>
      </Stack>

      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Pusat Bantuan
          </Typography>
                     <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
             Temukan jawaban untuk pertanyaan Anda atau hubungi tim support kami
           </Typography>

           {/* Login prompt for non-logged in users */}
           {!isLoggedIn && (
             <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 4, borderRadius: 3 }}>
               <Typography variant="body2">
                 Untuk mengakses fitur lengkap dan membuat laporan pengaduan, silakan{' '}
                 <Button 
                   component={Link} 
                   to="/login" 
                   size="small" 
                   sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                 >
                   login
                 </Button>
                 {' '}atau{' '}
                 <Button 
                   component={Link} 
                   to="/register" 
                   size="small" 
                   sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                 >
                   daftar akun baru
                 </Button>
               </Typography>
             </Alert>
           )}

          {/* Search Box */}
          <Paper sx={{ 
            maxWidth: 600, 
            mx: 'auto', 
            p: 1, 
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Search color="action" sx={{ ml: 2 }} />
              <TextField
                fullWidth
                placeholder="Cari pertanyaan atau kata kunci..."
                variant="standard"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{ fontSize: '1.1rem' }}
              />
            </Stack>
          </Paper>
        </Box>

        <Grid container spacing={4}>
          {/* Quick Guide */}
          <Grid item xs={12}>
            <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                <Book sx={{ mr: 2, verticalAlign: 'bottom' }} />
                Panduan Cepat
              </Typography>
              
              <Grid container spacing={3}>
                {quickGuide.map((guide) => (
                  <Grid item xs={12} sm={6} md={3} key={guide.step}>
                    <Card sx={{ 
                      height: '100%', 
                      textAlign: 'center', 
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Avatar sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main'
                        }}>
                          {guide.icon}
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {guide.step}. {guide.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {guide.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* FAQ Section */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                <QuestionAnswer sx={{ mr: 2, verticalAlign: 'bottom' }} />
                Pertanyaan yang Sering Diajukan (FAQ)
              </Typography>

              {/* Category Filter */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={`${category.label} (${category.count})`}
                      onClick={() => setSelectedCategory(category.id)}
                      color={selectedCategory === category.id ? 'primary' : 'default'}
                      variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* FAQ List */}
              {filteredFAQ.length > 0 ? (
                <Box>
                  {filteredFAQ.map((faq, index) => (
                    <Accordion key={index} sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="body1" fontWeight={500}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {faq.answer}
                        </Typography>
                        <Box>
                          {faq.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1, fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Tidak ada FAQ yang sesuai dengan pencarian "{searchQuery}". Coba kata kunci lain atau hubungi support.
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Contact & Resources */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Contact Support */}
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  <ContactSupport sx={{ mr: 1, verticalAlign: 'bottom' }} />
                  Hubungi Support
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Masih butuh bantuan? Tim support kami siap membantu Anda.
                </Typography>
                
                <List dense>
                  {contactMethods.map((method, index) => (
                    <ListItem 
                      key={index} 
                      button 
                      onClick={method.action}
                      sx={{ 
                        borderRadius: 2, 
                        mb: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          {React.cloneElement(method.icon, { 
                            fontSize: 'small', 
                            color: 'primary' 
                          })}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={method.title}
                        secondary={`${method.value} • ${method.description}`}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => setContactDialog(true)}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  Kirim Pesan
                </Button>
              </Paper>

              {/* Quick Links */}
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tautan Berguna
                </Typography>
                
                <List dense>
                  <ListItem button sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Panduan PDF" />
                  </ListItem>
                  <ListItem button sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><PlayArrow fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Video Tutorial" />
                  </ListItem>
                  <ListItem button sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Kebijakan Privasi" />
                  </ListItem>
                  <ListItem button sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemIcon><BugReport fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Laporkan Bug" />
                  </ListItem>
                </List>
              </Paper>

              {/* Office Hours */}
              <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  <Schedule sx={{ mr: 1, verticalAlign: 'bottom' }} />
                  Jam Operasional
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Senin - Jumat: 08:00 - 17:00 WIB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sabtu: 08:00 - 12:00 WIB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Minggu: Tutup
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Support online 24/7 melalui website
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Contact Form Dialog */}
        <Dialog open={contactDialog} onClose={() => setContactDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Kirim Pesan ke Support
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Nama Lengkap"
                value={contactForm.name}
                onChange={handleInputChange('name')}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={handleInputChange('email')}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Kategori"
                select
                SelectProps={{ native: true }}
                value={contactForm.category}
                onChange={handleInputChange('category')}
                variant="outlined"
              >
                <option value="umum">Pertanyaan Umum</option>
                <option value="teknis">Masalah Teknis</option>
                <option value="akun">Masalah Akun</option>
                <option value="laporan">Bantuan Laporan</option>
                <option value="bug">Laporkan Bug</option>
                <option value="saran">Saran & Feedback</option>
              </TextField>
              <TextField
                fullWidth
                label="Subjek"
                value={contactForm.subject}
                onChange={handleInputChange('subject')}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Pesan"
                multiline
                rows={4}
                value={contactForm.message}
                onChange={handleInputChange('message')}
                variant="outlined"
                placeholder="Jelaskan masalah atau pertanyaan Anda secara detail..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setContactDialog(false)}>
              Batal
            </Button>
            <Button 
              variant="contained" 
              onClick={handleContactSubmit}
              startIcon={<Send />}
            >
              Kirim Pesan
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default HelpPage; 